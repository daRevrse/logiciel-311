const { User } = require('./models');

async function check() {
  try {
    const users = await User.findAll({ 
      attributes: ['email', 'role', 'is_active', 'password_hash'] 
    });
    console.log('--- USERS IN DB ---');
    users.forEach(u => {
      console.log(`${u.email} | ${u.role} | Active: ${u.is_active} | HasPassword: ${!!u.password_hash}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
