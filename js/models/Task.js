import { generateUUID } from '../utils/uuid.js';

/**
 * Task Model
 * Represents a task in the life or learning management system
 */
class Task {
  constructor(data) {
    this.id = data.id || generateUUID();
    this.date = data.date;
    this.type = data.type; // 'life' | 'learning'
    this.title = data.title;
    this.notes = data.notes || '';
    this.reward = data.reward || '';
    this.completed = data.completed || false;
    this.color = data.color || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Validates the task data
   * @throws {ValidationError} if validation fails
   */
  validate() {
    const errors = [];

    if (!this.title || this.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!this.date) {
      errors.push('Date is required');
    }

    if (!this.type || !['life', 'learning'].includes(this.type)) {
      errors.push('Type must be either "life" or "learning"');
    }

    if (typeof this.completed !== 'boolean') {
      errors.push('Completed must be a boolean');
    }

    if (errors.length > 0) {
      throw new ValidationError('Task validation failed', errors);
    }

    return true;
  }

  /**
   * Converts the task to a JSON object
   * @returns {Object} JSON representation of the task
   */
  toJSON() {
    return {
      id: this.id,
      date: this.date,
      type: this.type,
      title: this.title,
      notes: this.notes,
      reward: this.reward,
      completed: this.completed,
      color: this.color,
      createdAt: this.createdAt
    };
  }

  /**
   * Creates a Task instance from a JSON object
   * @param {Object} json - JSON object
   * @returns {Task} Task instance
   */
  static fromJSON(json) {
    return new Task(json);
  }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export { Task, ValidationError };
