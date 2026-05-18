const { mongoose } = require('../db');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    user_type: {
      type: String,
      required: true,
      enum: ['customer', 'admin', 'seller'],
      default: 'customer',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
