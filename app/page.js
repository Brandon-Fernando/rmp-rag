'use client'
import { Button, TextField, Box, Stack, AppBar, Toolbar, Container, Typography } from "@mui/material";
import Image from "next/image";
import React, { useState } from "react";
//import { Pinecone } from "@pinecone-database/pinecone";



export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant", 
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ])

const [message, setMessage] = useState('')
const [professors, setProfessors] = useState([])

// const pc = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY,
// })

// const index = pc.index('rag').namespace('ns')




const sendMessage = async () => {
  setMessages((messages) => [
    ...messages, 
    {role: "user", content: message}, 
    {role: "assistant", content: ''}
  ])

  setMessage('')

  const response = fetch('/api/chat', {
    method: "POST", 
    headers: {
      'Content-Type': 'application/json'
    }, 
    body: JSON.stringify([...messages, {role: "user", content: message}])
  }).then(async (res) => {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    let result = ''
    return reader.read().then(function processText({done, value}){
      if(done) {
        return result
      }
      const text = decoder.decode(value || new Uint8Array(), {stream: true})
      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1]
        let otherMessages = messages.slice(0, messages.length - 1)
        return [
          ...otherMessages, 
          {...lastMessage, content: lastMessage.content + text},
        ]
      })
      return reader.read().then(processText)
    })
  })
}


const handleSubmit = async () => {
  const link = document.getElementById('linkInput').value;
  if (link) {
    const response = await fetch('/api/processLink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link }),
    });

    if (response.ok) {
      setStatusMessage('Link processed successfully!');
    } else {
      setStatusMessage('Failed to process the link.');
    }
  } else {
    setStatusMessage('Please enter a link.');
  }
};


  return (
    <Container disableGutters sx={{minWidth: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>

      {/* header */}
      <AppBar position="absolute">
        <Toolbar sx={{bgcolor: 'black', padding:"8px"}}>
            <Image src="/rmp-logo.png" alt="Logo" width={125} height={50} />
        </Toolbar>
      </AppBar>



      <Box
        mt="66px"
        display="flex"
        flexDirection="row"
        // alignItems="center"
        // justifyContent="center"
        width="100%"
        sx={{flex: 1}}
        p={5}
        gap={10}
        >

          {/* add professors / show professors */}
          <Box
            width={510}
            display="flex"
            flexDirection="column"
            >
            <Typography variant="h5" fontWeight={"bold"}>
              Add Your Professors
            </Typography>
            <Box
              mt={1}
              border="3px solid black"
              borderRadius={4}
              boxShadow= "6px 6px 6px rgba(0, 0, 0, 1)"
              height={150}
              bgcolor="#D9D9D9"
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              gap={3}>
                <TextField 
                  id="linkInput"
                  type="text"
                  placeholder="Enter Professor Link"
                  sx={{
                    bgcolor: "white",
                    width: "60%",
                    '& .MuiOutlinedInput-root': {
                        "& fieldset": {
                            border: "3px solid black", 
                            boxShadow: "4px 4px 4px rgba(0, 0, 0, 1)"
                        },
                        "&:hover fieldset": {
                            border: "2px solid black",
                            boxShadow: "4px 4px 4px rgba(0, 0, 0, 1)"
                        },
                        "&.Mui-focused fieldset": {
                            border: "3px solid black", 
                            boxShadow: "4px 4px 4px rgba(0, 0, 0, 1)"
                        },
                    }
                }}/>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disableRipple
                  sx={{
                    textTransform: "none", 
                    background: "#0900FF",
                    borderRadius: 9, 
                    width: 100, 
                    height: 50, 
                    fontWeight: "bold", 
                    border: "3px solid black", 
                    boxShadow: "4px 4px 4px rgba(0, 0, 0, 0.7)",
                    '&:hover': {
                      background: "#0900FE", 
                      border: "3px solid black", 
                      boxShadow: "4px 4px 4px rgba(0, 0, 0, 1)",
                    }, 
                    '&:active': {
                      background: "#0900FE", 
                      border: "2px solid black", 
                      boxShadow: "4px 4px 4px rgba(0, 0, 0, 0.6)"
                    }
                  }}
                  >
                    Add
                </Button>
            </Box>

            <Typography variant="h5" fontWeight={"bold"} mt={4}>
              Professors Added
            </Typography>
            <Stack
              mt={1}
              border="3px solid black"
              borderRadius={4}
              boxShadow="6px 6px 6px rgba(0, 0, 0, 1)"
              bgcolor="#D9D9D9"
              sx={{flex: 1}}
              >

            </Stack>
          </Box>

          {/* AI chat */}
          <Box
            display="flex"
            flexDirection="column"
            sx={{flex: 1}}
            >
              <Typography variant="h5" fontWeight={"bold"}>
                Ask AI
              </Typography>

              <Stack 
                mt={1}
                border="3px solid black"
                borderRadius={4}
                boxShadow="6px 6px 6px rgba(0, 0, 0, 1)"
                bgcolor="#D9D9D9"
                sx={{flex: 1}}
                p={3}
                >
                  <Stack
                    direction="column"
                    spacing={2}
                    flexGrow={1}
                    overflow="auto"
                    maxHeight="100%">
                    {messages.map((message, index) => (
                      <Box
                        key={index}
                        display="flex"
                        justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}>
                        <Box
                          bgcolor={
                          message.role === 'assistant' ? 'white' : '#0900FF'
                          }
                          color={
                            message.role === 'assistant' ? 'black' : 'white'
                          }
                          fontSize={14}
                          border="3px solid black"
                          boxShadow="4px 4px 4px rgba(0, 0, 0, 1)"
                          borderRadius={4}
                          px={3}
                          py={2}
                          >
                            {message.content}
                        </Box>
                      </Box>
                    ))}
                    </Stack>
                    <Stack
                      direction = "row" spacing ={2}>
                      <TextField
                        placeholder="Ask here"
                        fullWidth
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value)
                        }}
                        sx={{
                          bgcolor: "white",
                          '& .MuiOutlinedInput-root': {
                              "& fieldset": {
                                  border: "3px solid black", 
                                  boxShadow: "4px 4px 4px rgba(0, 0, 0, 1)"
                              },
                              "&:hover fieldset": {
                                  border: "2px solid black",
                                  boxShadow: "4px 4px 4px rgba(0, 0, 0, 1)"
                              },
                              "&.Mui-focused fieldset": {
                                  border: "3px solid black", 
                                  boxShadow: "4px 4px 4px rgba(0, 0, 0, 1)"
                              },
                          }
                        }}/>
                      <Button
                        variant="contained" 
                        onClick={sendMessage}
                        disableRipple
                        sx={{
                          textTransform: "none", 
                          background: "#0900FF",
                          borderRadius: 9, 
                          width: 100, 
                          height: 50, 
                          fontWeight: "bold", 
                          border: "3px solid black", 
                          boxShadow: "4px 4px 4px rgba(0, 0, 0, 0.7)",
                          '&:hover': {
                            background: "#0900FE", 
                            border: "3px solid black", 
                            boxShadow: "4px 4px 4px rgba(0, 0, 0, 1)",
                          }, 
                          '&:active': {
                            background: "#0900FE", 
                            border: "2px solid black", 
                            boxShadow: "4px 4px 4px rgba(0, 0, 0, 0.6)"
                          }
                        }}>
                        Send
                      </Button>
                    </Stack>
              </Stack>
              
          </Box>


      </Box>
  </Container>
  );
}


