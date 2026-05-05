import { Request, Response } from 'express';
import EmailTemplateModel from '../models/emailTemplateModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import mongoose from 'mongoose';


export const getAllEmailTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const templates = await EmailTemplateModel
    .find({})
    .sort({ created_at: -1 })
    .lean();

  return res.status(200).json({
    status: 1,
    message: 'Email templates fetched successfully',
    data: templates,
  });
});


export const getEmailTemplateById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 0,
        message: 'Template ID is required'
      });
    }

    const template = await EmailTemplateModel.findById(id).lean();

    if (!template) {
      return res.status(404).json({
        status: 0,
        message: 'Email template not found'
      });
    }

    return res.json({
      status: 1,
      data: template
    });

  } catch (error) {
    return res.status(500).json({
      status: 0,
      message: 'Something went wrong'
    });
  }
};

export const saveEmailTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id, title, subject, body } = req.body;

  // ✅ Validate ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 0,
      message: 'Email Template ID is required or invalid',
    });
  }

  // ✅ Update only
  const template = await EmailTemplateModel.findByIdAndUpdate(
    id,
    {
      title,
      subject,
      body,
      updated_at: new Date(),
    },
    { new: true }
  ).lean();

  if (!template) {
    return res.status(404).json({
      status: 0,
      message: 'Email Template not found',
    });
  }

  return res.status(200).json({
    status: 1,
    message: 'Email Template updated successfully',
    data: template,
  });
});


export const getEmailTemplateDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.body;

    // ✅ Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: 'Email Template ID is required or invalid',
      });
    }

    // ✅ Fetch template
    const template = await EmailTemplateModel.findById(id).lean();

    if (!template) {
      return res.status(404).json({
        status: 0,
        message: 'Email Template not found',
      });
    }

    return res.status(200).json({
      status: 1,
     // message: 'Email Template details fetched successfully',
      data: template,
    });
  }
);






