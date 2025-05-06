import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../db/models';
import { AppError } from '../middleware/error.middleware';

const signToken = (id: any): string => {
  const idString = typeof id === 'object' && id !== null ? id.toString() : String(id);
  return jwt.sign({ id: idString }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = signToken(user._id);

    // Remove password from output
    const userObj = user.toObject();

    const userObjToReturn = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: userObjToReturn,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, role } = req.body as { email: string; password: string; role?: 'student' | 'admin' };

    // Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Check if user has the correct role
    if (role && user.role !== role) {
      return next(new AppError(`Invalid login attempt. Please use the ${user.role} login.`, 403));
    }

    // Generate token
    const token = signToken(user._id);

    // Remove password from output
    const userObj = user.toObject();
    const userObjToReturn = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userObjToReturn,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1) Check if user is trying to update email (not allowed)
    if (req.body.email) {
      return next(new AppError('Email cannot be changed', 400));
    }

    // 2) Filtered out unwanted fields
    const filteredBody: { name?: string; password?: string } = {};
    if (req.body.name) filteredBody.name = req.body.name;
    if (req.body.password) filteredBody.password = req.body.password;

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
      new: true,
      runValidators: true
    });

    // Remove password from response
    if (updatedUser) {
      const user = updatedUser.toObject();
      const userObjToReturn = {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      

      res.status(200).json({
        status: 'success',
        data: {
          user: userObjToReturn
        }
      });
    } else {
      return next(new AppError('User not found', 404));
    }
  } catch (error) {
    next(error);
  }
}; 