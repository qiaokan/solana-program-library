import {
  createTokenSwap,
  swap,
} from './token-swap-test';
import {CurveType, Numberu64} from '../dist';

async function main() {
  // These test cases are designed to run sequentially and in the following order
  console.log('Run test: createTokenSwap (constant price)');
  await createTokenSwap(CurveType.ConstantProduct);
  console.log('Run test: swap');
  await swap();
}

main()
  .catch(err => {
    console.error(err);
    process.exit(-1);
  })
  .then(() => process.exit());
