import {
  createAccountAndSwapAtomic,
  createTokenSwap,
  swap,
  depositAllTokenTypes,
  withdrawAllTokenTypes,
  depositSingleTokenTypeExactAmountIn,
  withdrawSingleTokenTypeExactAmountOut,
} from './token-swap-test';
import {CurveType, Numberu64} from '../dist';

async function main() {
  // These test cases are designed to run sequentially and in the following order
  console.log('Run test: createTokenSwap (constant price)');
  await createTokenSwap(CurveType.ConstantPrice, new Numberu64(1), false);
  console.log(
    'Run test: createTokenSwap (constant product, used further in tests)',
  );
}

main()
  .catch(err => {
    console.error(err);
    process.exit(-1);
  })
  .then(() => process.exit());
