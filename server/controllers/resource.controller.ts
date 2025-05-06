import { Request, Response, NextFunction } from 'express';
import { Resource } from '../db/models';
import { AppError } from '../middleware/error.middleware';

export const createResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const resource = await Resource.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      data: {
        resource,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllResources = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, type, tag } = req.query;
    const query: any = { isPublic: true };

    if (category) query.category = category;
    if (type) query.type = type;
    if (tag) query.tags = tag;

    const resources = await Resource.find(query)
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: resources.length,
      data: {
        resources,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!resource) {
      return next(new AppError('No resource found with that ID', 404));
    }

    // Increment view count
    resource.viewCount += 1;
    await resource.save();

    res.status(200).json({
      status: 'success',
      data: {
        resource,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new AppError('No resource found with that ID', 404));
    }

    // Check if user is the creator or an admin
    if (
      resource.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError('You do not have permission to update this resource', 403)
      );
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        resource: updatedResource,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new AppError('No resource found with that ID', 404));
    }

    // Check if user is the creator or an admin
    if (
      resource.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError('You do not have permission to delete this resource', 403)
      );
    }

    await resource.deleteOne();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 