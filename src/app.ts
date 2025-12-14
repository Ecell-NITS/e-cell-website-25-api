import express from 'express';
import { PrismaClient } from '@prisma/client'; // 1. Import Prisma

const app = express();
const prisma = new PrismaClient(); // 2. Initialize Prisma

app.use(express.json());

// Existing Routes 
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/version', (_req, res) => res.json({ version: '1.0.0' }));

// Delete Query
app.delete('/deletequery', async (req, res) => {
  const { Id } = req.body;

  if (!Id) {
    res.status(400).json({ error: "Required parameter 'Id' is missing." });
    return;
  }

  try {
    await prisma.query.delete({
      where: {
        id: Id, 
      },
    });
    res.status(200).json({ message: "Query deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete query. ID might not exist." });
  }
});





// Check Email 
app.post('/checkEmail', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Required parameter 'email' is missing." });
    return;
  }

  try {
    // Check if a user with this email exists in the database
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (user) {
      // User found
      res.status(200).json({ exists: true, message: "Email found." });
    } else {
      // User not found
      res.status(200).json({ exists: false, message: "Email not found." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error while checking email." });
  }
});


// Send OTP
app.post('/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  // 1. Validation
  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP are required parameters." });
    return;
  }

  try {
    // 2. Database Operation: Upsert (Update if exists, Insert if new)
    await prisma.user.upsert({
      where: { email: email },
      update: {
        otp: otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
      },
      create: {
        email: email,
        otp: otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
      },
    });

    res.status(200).json({ message: "OTP sent and stored successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to store OTP." });
  }
});


// Verify OTP 
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  // 1. Validation
  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP are required parameters." });
    return;
  }

  try {
    // 2. Find the user
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // 3. Check if user exists and OTP matches
    if (!user || user.otp !== otp) {
      res.status(400).json({ success: false, message: "Invalid OTP or Email." });
      return;
    }

    // 4. Check if OTP is expired
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      res.status(400).json({ success: false, message: "OTP has expired." });
      return;
    }

    // 5. Verification Successful: Clear the OTP so it can't be reused
    await prisma.user.update({
      where: { email: email },
      data: {
        otp: null,
        otpExpiry: null,
      },
    });

    res.status(200).json({ success: true, message: "OTP Verified Successfully." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Verification failed." });
  }
});

// Get Blogs
app.get('/getblogs', async (_req, res) => {
  try {
    // Fetch all blogs from the database
    const blogs = await prisma.blog.findMany();

    // Send the list of blogs back to the user
    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch blogs." });
  }
});

// Get Blog by ID
app.get('/getblogs/:blogId', async (req, res) => {
  const { blogId } = req.params;

  if (!blogId) {
    res.status(400).json({ error: "Required parameter 'blogId' is missing." });
    return;
  }

  try {
    // Fetch the specific blog where the ID matches
    const blog = await prisma.blog.findUnique({
      where: {
        id: blogId,
      },
    });

    if (blog) {
      res.status(200).json(blog);
    } else {
      res.status(404).json({ error: "Blog not found." });
    }
  } catch (error) {
    console.error(error);
    // This usually happens if the ID format is wrong (not a valid MongoDB ObjectID)
    res.status(500).json({ error: "Invalid Blog ID or Server Error." });
  }
});

// Get Accepted Blogs
app.get('/acceptedBlogs', async (req, res) => {
  
  const blogId = req.query.blogId as string;
  const email = req.query.email as string;

  if (!blogId || !email) {
    res.status(400).json({ error: "Required parameters 'blogId' and 'email' are missing." });
    return;
  }

  try {
    // Find the blog that matches the ID
    const blog = await prisma.blog.findUnique({
      where: {
        id: blogId,
      },
    });

    // Check if blog exists, if the email matches, and if it is actually accepted
    if (!blog) {
      res.status(404).json({ error: "Blog not found." });
      return;
    }

    if (blog.writerEmail !== email) {
      res.status(403).json({ error: "Email does not match the blog writer." });
      return;
    }

    
    if (!blog.isAccepted) {
      res.status(400).json({ message: "This blog is not yet accepted." });
      return;
    }

    res.status(200).json(blog);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching accepted blog." });
  }
});


//  Publish Blog
app.post('/publishBlog/:Id', async (req, res) => {
  const { Id } = req.params; // Get the ID from the URL
  const { email, writerName, subject, text } = req.body; // Get details from body

  // 1. Validation
  if (!Id || !email || !writerName || !subject || !text) {
    res.status(400).json({ error: "All fields (Id, email, writerName, subject, text) are required." });
    return;
  }

  try {
    // 2. Find the blog first to ensure it exists and verify email
    const existingBlog = await prisma.blog.findUnique({
      where: { id: Id },
    });

    if (!existingBlog) {
      res.status(404).json({ error: "Blog not found." });
      return;
    }

    // Optional: Verify that the person publishing is the original writer
    if (existingBlog.writerEmail !== email) {
      res.status(403).json({ error: "Unauthorized: Email does not match the blog writer." });
      return;
    }

    // 3. Update the blog with new details and mark as Accepted
    const updatedBlog = await prisma.blog.update({
      where: { id: Id },
      data: {
        subject: subject,
        text: text,
        writerName: writerName, // Update name if changed
        isAccepted: true,       // Mark as published/accepted
      },
    });

    res.status(200).json({ message: "Blog published successfully.", blog: updatedBlog });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to publish blog." });
  }
});

// Delete Blog 
app.delete('/deleteBlog/:blogId', async (req, res) => {
  const { blogId } = req.params; // Get ID from URL
  const { email, writerName } = req.body; // Get verification details from Body

  // 1. Validation
  if (!blogId || !email || !writerName) {
    res.status(400).json({ error: "Required parameters (blogId, email, writerName) are missing." });
    return;
  }

  try {
    // 2. Find the blog first to verify ownership
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      res.status(404).json({ error: "Blog not found." });
      return;
    }

    // 3. Verification: Check if the email and writer name match the blog's record
    if (blog.writerEmail !== email || blog.writerName !== writerName) {
      res.status(403).json({ error: "Unauthorized: Details do not match the blog writer." });
      return;
    }

    // 4. Delete the blog
    await prisma.blog.delete({
      where: { id: blogId },
    });

    res.status(200).json({ message: "Blog deleted successfully." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete blog." });
  }
});


//  Edit Blog 
app.put('/editBlog/:blogId', async (req, res) => {
  const { blogId } = req.params; // Get ID from URL
  
  
  const {
    title,
    tag,
    intro,
    content,
    writerName,
    writerIntro,
    writerPic,
    timestamp, 
    topicPic,
    writerEmail
  } = req.body;

  // 1. Validation: Ensure all fields are provided
  if (
    !blogId || !title || !tag || !intro || !content || 
    !writerName || !writerIntro || !writerPic || !timestamp || 
    !topicPic || !writerEmail
  ) {
    res.status(400).json({ error: "All fields are required to edit the blog." });
    return;
  }

  try {
    // 2. Check if the blog exists first 
    const existingBlog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!existingBlog) {
      res.status(404).json({ error: "Blog not found." });
      return;
    }

    // 3. Update the blog in the database
    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        title,
        tag,
        intro,
        content,
        writerName,
        writerIntro,
        writerPic,
        timeStamp: timestamp, // Mapping input 'timestamp' to DB field 'timeStamp'
        topicPic,
        writerEmail
      },
    });

    res.status(200).json({ message: "Blog updated successfully.", blog: updatedBlog });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update blog." });
  }
});

export default app;