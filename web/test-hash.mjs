import bcrypt from 'bcryptjs';

const testCases = [
  { password: 'Indla', hash: '$2b$10$0FzmFREeApRVMdoqcGXeKeZxc9Cg7XinYo6Do7kOpOoy5P8VKHLwe' },
  { password: 'password123', hash: '$2b$10$dx2wma/l22dBpbgQmlSaa.uAdQq3i/HB3QbS5t/jwFLnu5ik7dr6K' },
];

for (const test of testCases) {
  const result = await bcrypt.compare(test.password, test.hash);
  console.log(`Password "${test.password}" matches: ${result}`);
}

