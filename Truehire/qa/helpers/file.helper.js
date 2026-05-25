import path from 'path';

export const fixturePath = (...segments) => path.resolve('qa/fixtures', ...segments);
