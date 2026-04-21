const User = require('../models/User');
const { generateToken, sendTokenResponse } = require('../middleware/auth');
const logger = require('../utils/logger');
const CategoryService = require('../services/categoryService');

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const { email, password, firstName, lastName, currency } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Create user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        currency: currency || {
          code: 'NGN',
          symbol: '₦',
          subunitName: 'kobo',
          subunitToUnit: 100
        }
      });

      // Create default categories for new user
      await CategoryService.createDefaultCategories(user._id);

      logger.info(`New user registered: ${user.email}`);
      sendTokenResponse(user, 201, res);
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password'
        });
      }

      // Find user with password
      const user = await User.findOne({ email, isActive: true }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email}`);
      sendTokenResponse(user, 200, res);
    } catch (error) {
      logger.error('Login error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    try {
      const isProduction = process.env.NODE_ENV === 'production';

      // Clear cookie using the same attributes used when setting it.
      res.cookie('token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
      });

      logger.info(`User logged out: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  static async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id);

      res.json({
        success: true,
        data: user.getPublicProfile()
      });
    } catch (error) {
      logger.error('Get me error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  static async refreshToken(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      sendTokenResponse(user, 200, res);
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AuthController;