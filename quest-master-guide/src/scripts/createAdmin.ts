import { connectDB } from '../db/config/mongodb';
import { User } from '../db/models';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Admin user details
    const adminUser = {
      name: 'Asjad Ali',
      email: 'asjadali@gmail.com',
      password: 'admin123',
      role: 'admin',
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminUser);
    console.log('Admin user created successfully:', {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin(); 