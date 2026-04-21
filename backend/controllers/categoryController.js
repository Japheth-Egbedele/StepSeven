const Category = require('../models/Category');
const logger = require('../utils/logger');
const CategoryService = require('../services/categoryService');

class CategoryController {
  /**
   * Get all categories for the authenticated user
   * GET /api/categories
   */
  static async getAll(req, res) {
    try {
      const userId = req.user.id;
      const { type, includeInactive } = req.query;

      const filter = { user: userId };
      if (type) filter.type = type.toUpperCase();
      if (!includeInactive) filter.isActive = true;

      const categories = await Category.find(filter)
        .populate('parent', 'name icon')
        .sort({ order: 1, name: 1 });

      // Organize into hierarchy
      const parentCategories = categories.filter(cat => !cat.parent);
      const childCategories = categories.filter(cat => cat.parent);

      const hierarchy = parentCategories.map(parent => ({
        ...parent.toObject(),
        children: childCategories.filter(child =>
          child.parent && child.parent._id.equals(parent._id)
        )
      }));

      logger.info(`Fetched ${categories.length} categories for user ${userId}`);

      res.json({
        success: true,
        data: categories,
        hierarchy,
        count: categories.length
      });
    } catch (error) {
      logger.error('Get all categories error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get a single category by ID
   * GET /api/categories/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const category = await Category.findOne({
        _id: id,
        user: userId
      }).populate('parent');

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Get children
      const children = await Category.find({
        user: userId,
        parent: id,
        isActive: true
      });

      logger.info(`Fetched category ${id} for user ${userId}`);

      res.json({
        success: true,
        data: {
          ...category.toObject(),
          children
        }
      });
    } catch (error) {
      logger.error('Get category by ID error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Create a new category
   * POST /api/categories
   */
  static async create(req, res) {
    try {
      const userId = req.user.id;
      const { name, type, parent, icon, color, description } = req.body;

      // Validate parent if provided
      if (parent) {
        const parentCategory = await Category.findOne({
          _id: parent,
          user: userId
        });

        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found'
          });
        }

        // Ensure parent has same type
        if (parentCategory.type !== type.toUpperCase()) {
          return res.status(400).json({
            success: false,
            message: 'Parent category must have the same type'
          });
        }
      }

      const categoryData = {
        user: userId,
        name,
        type: type.toUpperCase(),
        parent: parent || null,
        icon,
        color,
        description
      };

      const category = await Category.create(categoryData);

      logger.info(`Created category ${category.name} (${category.type}) for user ${userId}`);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      logger.error('Create category error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update a category
   * PUT /api/categories/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Prevent changing user or type
      delete updates.user;
      delete updates.type;
      delete updates.createdAt;

      // Validate parent if being updated
      if (updates.parent) {
        const parentCategory = await Category.findOne({
          _id: updates.parent,
          user: userId
        });

        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found'
          });
        }
      }

      const category = await Category.findOneAndUpdate(
        { _id: id, user: userId },
        updates,
        { new: true, runValidators: true }
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      logger.info(`Updated category ${id} for user ${userId}`);

      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      logger.error('Update category error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete a category (soft delete)
   * DELETE /api/categories/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const category = await Category.findOne({ _id: id, user: userId });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category has children
      const hasChildren = await Category.exists({
        user: userId,
        parent: id,
        isActive: true
      });

      if (hasChildren) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category with active sub-categories'
        });
      }

      // Soft delete
      category.isActive = false;
      await category.save();

      logger.info(`Deleted category ${id} for user ${userId}`);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      logger.error('Delete category error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Create default categories for user
   * POST /api/categories/defaults
   */
  static async createDefaults(req, res) {
    try {
      const userId = req.user.id;

      // Check if user already has categories
      const hasCategories = await CategoryService.hasCategories(userId);
      if (hasCategories) {
        return res.status(400).json({
          success: false,
          message: 'User already has categories. Delete them first if you want to recreate defaults.'
        });
      }

      const categories = await CategoryService.createDefaultCategories(userId);

      res.status(201).json({
        success: true,
        data: categories,
        message: `Created ${categories.length} default categories`
      });
    } catch (error) {
      logger.error('Create default categories error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = CategoryController;