import { Request, Response } from 'express';
import { uploadToCloudinary } from '../utils/cloudinary';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const url = await uploadToCloudinary(req.file.buffer, 'ecell-blogs');

    return res.status(200).json({
      message: 'Image uploaded successfully',
      data: { url },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ message: 'Failed to upload image' });
  }
};
