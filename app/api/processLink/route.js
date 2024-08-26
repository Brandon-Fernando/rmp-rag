import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(req) {
  const { link } = await req.json();

  if (link) {
    try {
      // Run the Python script with the provided link
      const { stdout, stderr } = await execPromise(`python3 load.py ${link}`);
      
      // Handle any output or errors from the Python script
      if (stderr) {
        console.error('Error:', stderr);
        return new Response(JSON.stringify({ message: 'An error occurred while processing the link.' }), { status: 500 });
      } else {
        return new Response(JSON.stringify({ message: 'Link processed successfully.' }), { status: 200 });
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ message: 'An error occurred while executing the script.' }), { status: 500 });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Link is required.' }), { status: 400 });
  }
}