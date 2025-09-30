const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ['common', 'organization'],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    console.log('[MONGOOSE PRE-SAVE] Senha não modificada, ignorando.');
    return next();
  }

  if (this.password.startsWith('$2b$') && this.password.length === 60) {
    console.log('[MONGOOSE PRE-SAVE] Senha já é um hash, ignorando:', this.password);
    return next();
  }

  try {
    console.log('[MONGOOSE PRE-SAVE] Hasheando senha:', this.password);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('[MONGOOSE PRE-SAVE] Novo hash:', this.password);
    next();
  } catch (error) {
    console.error('[MONGOOSE PRE-SAVE] Erro ao hashear senha:', error.message);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log('[MONGOOSE COMPARE] Senha recebida:', candidatePassword);
    console.log('[MONGOOSE COMPARE] Tipo da senha:', typeof candidatePassword);
    console.log('[MONGOOSE COMPARE] Comprimento da senha:', candidatePassword.length);
    console.log('[MONGOOSE COMPARE] Hash armazenado:', this.password);
    console.log('[MONGOOSE COMPARE] Tipo do hash:', typeof this.password);
    console.log('[MONGOOSE COMPARE] Comprimento do hash:', this.password.length);

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('[MONGOOSE COMPARE] Resultado da comparação:', isMatch);

    return isMatch;
  } catch (error) {
    console.error('[MONGOOSE COMPARE] Erro na comparação:', error.message);
    throw new Error(`Mongoose password comparison failed: ${error.message}`);
  }
};

module.exports = mongoose.model('User', userSchema);
