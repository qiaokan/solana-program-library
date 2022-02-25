import {
  createTokenSwap,
} from './token-swap-test';
import {CurveType, Numberu64} from '../dist';

async function main() {
  // These test cases are designed to run sequentially and in the following order
  await createTokenSwap(CurveType.ConstantProduct, new Numberu64(1),true);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(-1);
  })
  .then(() => process.exit());
