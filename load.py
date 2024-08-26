import sys
from pinecone import Pinecone, ServerlessSpec
import os 
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def scrapeReviews(profLink):
    response = requests.get(profLink)
    soup = BeautifulSoup(response.content, 'html.parser')

    profReviews = []
    studentReviews = []
    
    try:
        professor_fname = soup.find('div', class_='NameTitle__Name-dowf0z-0 cfjPUG').text.strip()
        professor_lname = soup.find('span', class_='NameTitle__LastNameWrapper-dowf0z-2 glXOHH').text.strip()
        prof_name = professor_fname + " " + professor_lname
        rating = soup.find('div', class_='RatingValue__Numerator-qw8sqy-2 liyUjw').text.strip()

        difficulty = soup.find('div', class_='FeedbackItem__FeedbackNumber-uof32n-1 kkESWs').text.strip()
        subject = soup.find('a', class_='TeacherDepartment__StyledDepartmentLink-fl79e8-0 iMmVHb').text.strip()

        for review in soup.find_all('div', class_='Rating__RatingBody-sc-1rhvpxz-0 dGrvXb'):
            review_text = review.find('div', class_='Comments__StyledComments-dzzyvm-0 gRjWel').text.strip()
            studentReviews.append(review_text)

        formatted_reviews = {
            "professor": prof_name,
            "subject-department": subject,
            "rating": rating,
            "difficulty": difficulty,
            "student_reviews": studentReviews
        }

        profReviews = [formatted_reviews]
    
    except AttributeError:
        print("Error parsing some elements from the page.")
    
    return profReviews

def addReviews(reviews, json_file='reviews.json'):
    try:
        with open(json_file, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        data = {'reviews': []}
    except json.JSONDecodeError:
        data = {'reviews': []}
    
    data['reviews'].extend(reviews)
    
    with open(json_file, 'w') as file:
        json.dump(data, file, indent=4)



def process_and_upsert_link(link, index, namespace="ns"):
    client = OpenAI()
    
    reviews = scrapeReviews(link)
    addReviews(reviews)
    
    with open("reviews.json") as f:
        data = json.load(f)
    
    processed_data = []
    for review in data['reviews']:
        response = client.embeddings.create(
            input=review['student_reviews'], 
            model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding
        processed_data.append({
            "values": embedding, 
            "id": review["professor"], 
            "metadata": {
                "subject-department": review["subject-department"],
                "rating": review["rating"],
                "difficulty": review["difficulty"],
                "student_reviews": review["student_reviews"]
            }
        })
    
    index.upsert(
        vectors=processed_data, 
        namespace=namespace
    )


def main(link):
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

    index_name = "rag"
    ex_name = ""

    # Check if index exists
    existing_indexes = pc.list_indexes()
    if existing_indexes:
        ex_name = existing_indexes[0]['name'] 
        print("deez")
        print(ex_name)
    
    if index_name != ex_name:
        pc.create_index(
            name=index_name, dimension=1536, metric="cosine", spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )

    index = pc.Index(index_name)
    
    # Process the link and upsert the data
    process_and_upsert_link(link, index)



 

if __name__ == "__main__":
    if len(sys.argv) > 1:
        link = sys.argv[1]
        main(link)
    else:
        print("No link provided.")