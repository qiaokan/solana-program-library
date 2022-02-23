import {
  swap,
} from './token-swap-test';
import {CurveType, Numberu64} from '../dist';

async function main() {
  await swap();
}

main()
  .catch(err => {
    console.error(err);
    process.exit(-1);
  })
  .then(() => process.exit());
