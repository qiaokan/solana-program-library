import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {AccountLayout, Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';


import {TokenSwap, CurveType, TOKEN_SWAP_PROGRAM_ID} from '../src';
import {sendAndConfirmTransaction} from '../src/util/send-and-confirm-transaction';
import {newAccountWithLamports, readAccountWithLamports} from '../src/util/new-account-with-lamports';
import {url} from '../src/util/url';
import {sleep} from '../src/util/sleep';
import {Numberu64} from '../dist';
let connection : Connection;
// Hard-coded fee address, for testing production mode
const SWAP_PROGRAM_OWNER_FEE_ADDRESS =
  process.env.SWAP_PROGRAM_OWNER_FEE_ADDRESS;

// Pool fees
const TRADING_FEE_NUMERATOR = 25;
const TRADING_FEE_DENOMINATOR = 10000;
const OWNER_TRADING_FEE_NUMERATOR = 5;
const OWNER_TRADING_FEE_DENOMINATOR = 10000;
const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 1;
const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 6;
const HOST_FEE_NUMERATOR = 20;
const HOST_FEE_DENOMINATOR = 100;

// Initial amount in each swap token
const currentSwapTokenA = 1000000;
const currentSwapTokenB = 1000000;

const SWAP_AMOUNT_IN = 10;

function assert(condition: boolean, message?: string) {
  if (!condition) {
    console.log(Error().stack + ':token-test.js');
    throw message || 'Assertion failed';
  }
}

async function getConnection(use_dev?:boolean): Promise<Connection> {
  if (connection) return connection;

  const actual_url = use_dev?'https://api.devnet.solana.com':url;
  connection = new Connection(actual_url, 'recent');
  const version = await connection.getVersion();

  console.log('Connection to cluster established:', actual_url, version);
  return connection;
}

export async function createTokenSwap(
  curveType: number,
  curveParameters?: Numberu64,
  use_dev?:boolean,
): Promise<void> {
  // Token swap
  let tokenSwap: TokenSwap;
  // authority of the token and accounts
  let authority: PublicKey;
  // bump seed used to generate the authority public key
  let bumpSeed: number;
  // Token pool
  let tokenPool: Token;
  let tokenAccountPool: PublicKey;
  let feeAccount: PublicKey;
  // Tokens swapped
  let mintA: Token;
  let mintB: Token;

  const connection = await getConnection(use_dev);
  const payer = await readAccountWithLamports(connection, '/Users/qiaokan/.config/solana/payer.json',1000000000);
  if (use_dev) {
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  const owner = await readAccountWithLamports(connection, '/Users/qiaokan/.config/solana/id.json',1000000000);
  const tokenSwapAccount = await readAccountWithLamports(connection, '/Users/qiaokan/.config/solana/weth_to_sol_id.json',0);
  console.log('swap pk:', tokenSwapAccount.publicKey.toString());
  //  console.log('swap sk:', tokenSwapAccount.secretKey.toJSON());

  [authority, bumpSeed] = await PublicKey.findProgramAddress(
    [tokenSwapAccount.publicKey.toBuffer()],
    TOKEN_SWAP_PROGRAM_ID,
  );
  console.log('authority:', authority.toString());

  console.log('creating pool mint');
  tokenPool = await Token.createMint(
    connection,
    payer,
    authority,
    null,
    2,
    TOKEN_PROGRAM_ID,
  );

  console.log('creating pool account');
  tokenAccountPool = await tokenPool.createAccount(owner.publicKey);
  const ownerKey = SWAP_PROGRAM_OWNER_FEE_ADDRESS || owner.publicKey.toString();
  feeAccount = await tokenPool.createAccount(new PublicKey(ownerKey));

  console.log('creating token A');
  /*
  mintA = await Token.createMint(
    connection,
    payer,
    owner.publicKey,
    null,
    2,
    TOKEN_PROGRAM_ID,
  );
  console.log('mintA:', mintA.publicKey.toString());

  console.log('creating token A account');
  tokenAccountA = await mintA.createAccount(authority);
  console.log('minting token A to swap');
  await mintA.mintTo(tokenAccountA, owner, [], currentSwapTokenA);
  */
  const soEth = new PublicKey('5GYUUQwZzPKK3Thwn5jpbTBPX6cgBTPYzN1Q9EvXWkBq');
  mintA = new Token(connection, soEth, TOKEN_PROGRAM_ID, payer);
  const tokenAccountA = new PublicKey('LHea2VAPyPQHybWAGKGbRrwBWHXa6vytUqsTnZEpnGN');
  console.log('tokenAccountA:', tokenAccountA.toString());
  //await mintA.mintTo(tokenAccountA, owner, [], currentSwapTokenA);

  console.log('creating token B');
  const wsol = new PublicKey('52Y4nFRc8cH6YsKWwcYRj3HjApyU9EKGdwJGR9HdFXBJ');
  mintB = new Token(connection, wsol, TOKEN_PROGRAM_ID, payer);
  console.log('mintB:', mintB.publicKey.toString());

  console.log('creating token B account');
  const tokenAccountB = new PublicKey('CBxRgwmFftLRE7vCqi5csVaQMFu5B8yR8vFgXXhXPWEP');
  console.log('tokenAccountB:', tokenAccountB.toString());

  console.log('creating token swap');
  if (use_dev) {
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  const swapPayer = await readAccountWithLamports(connection, '/Users/qiaokan/.config/solana/alice.json',1000000000);
  tokenSwap = await TokenSwap.createTokenSwap(
    connection,
    swapPayer,
    tokenSwapAccount,
    authority,
    tokenAccountA,
    tokenAccountB,
    tokenPool.publicKey,
    mintA.publicKey,
    mintB.publicKey,
    feeAccount,
    tokenAccountPool,
    TOKEN_SWAP_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    TRADING_FEE_NUMERATOR,
    TRADING_FEE_DENOMINATOR,
    OWNER_TRADING_FEE_NUMERATOR,
    OWNER_TRADING_FEE_DENOMINATOR,
    OWNER_WITHDRAW_FEE_NUMERATOR,
    OWNER_WITHDRAW_FEE_DENOMINATOR,
    HOST_FEE_NUMERATOR,
    HOST_FEE_DENOMINATOR,
    curveType,
    curveParameters,
  );

  console.log('loading token swap');
  const fetchedTokenSwap = await TokenSwap.loadTokenSwap(
    connection,
    tokenSwapAccount.publicKey,
    TOKEN_SWAP_PROGRAM_ID,
    swapPayer,
  );
  assert(fetchedTokenSwap.tokenProgramId.equals(TOKEN_PROGRAM_ID));
  assert(fetchedTokenSwap.tokenAccountA.equals(tokenAccountA));
  assert(fetchedTokenSwap.tokenAccountB.equals(tokenAccountB));
  assert(fetchedTokenSwap.mintA.equals(mintA.publicKey));
  assert(fetchedTokenSwap.mintB.equals(mintB.publicKey));
  assert(fetchedTokenSwap.poolToken.equals(tokenPool.publicKey));
  assert(fetchedTokenSwap.feeAccount.equals(feeAccount));
  assert(
    TRADING_FEE_NUMERATOR == fetchedTokenSwap.tradeFeeNumerator.toNumber(),
  );
  assert(
    TRADING_FEE_DENOMINATOR == fetchedTokenSwap.tradeFeeDenominator.toNumber(),
  );
  assert(
    OWNER_TRADING_FEE_NUMERATOR ==
      fetchedTokenSwap.ownerTradeFeeNumerator.toNumber(),
  );
  assert(
    OWNER_TRADING_FEE_DENOMINATOR ==
      fetchedTokenSwap.ownerTradeFeeDenominator.toNumber(),
  );
  assert(
    OWNER_WITHDRAW_FEE_NUMERATOR ==
      fetchedTokenSwap.ownerWithdrawFeeNumerator.toNumber(),
  );
  assert(
    OWNER_WITHDRAW_FEE_DENOMINATOR ==
      fetchedTokenSwap.ownerWithdrawFeeDenominator.toNumber(),
  );
  assert(HOST_FEE_NUMERATOR == fetchedTokenSwap.hostFeeNumerator.toNumber());
  assert(
    HOST_FEE_DENOMINATOR == fetchedTokenSwap.hostFeeDenominator.toNumber(),
  );
  assert(curveType == fetchedTokenSwap.curveType);
}

export async function swap(): Promise<void> {
  const connection = await getConnection(true);
  const swapPayer = await readAccountWithLamports(connection, '/Users/qiaokan/.config/solana/alice.json',0);
  const tokenSwapPk = new PublicKey('DqZpaUFTkYMCoer4Bqhr1NErkj958EcB2cynmKpRQcwh');
  const fetchedTokenSwap = await TokenSwap.loadTokenSwap(
    connection,
    tokenSwapPk,
    TOKEN_SWAP_PROGRAM_ID,
    swapPayer,
  );

  const swapper = await readAccountWithLamports(connection, '/Users/qiaokan/.config/solana/id.json',0);
  const owner = await readAccountWithLamports(connection, '/Users/qiaokan/.config/solana/kan.json',0);
  const payer = await readAccountWithLamports(connection, '/Users/qiaokan/.config/solana/payer.json',0);
  const tokenPool = new Token(connection, fetchedTokenSwap.poolToken, TOKEN_PROGRAM_ID, payer);
  const mintA = new Token(connection, fetchedTokenSwap.mintA, TOKEN_PROGRAM_ID, payer);
  const mintB = new Token(connection, fetchedTokenSwap.mintB, TOKEN_PROGRAM_ID, payer);
  console.log('Creating swap token a account');
  const userAccountA = await mintA.getOrCreateAssociatedAccountInfo(swapper.publicKey);
  const userTransferAuthority = new Account();
  await mintA.approve(
    userAccountA.address,
    userTransferAuthority.publicKey,
    swapper,
    [],
    SWAP_AMOUNT_IN,
  );
  console.log('Creating swap token b account');
  const userAccountB = await mintB.getOrCreateAssociatedAccountInfo(swapper.publicKey);
  const poolAccount = SWAP_PROGRAM_OWNER_FEE_ADDRESS
    ? await tokenPool.createAccount(owner.publicKey)
    : null;
  const tokenAccountA = fetchedTokenSwap.tokenAccountA;
  const tokenAccountB = fetchedTokenSwap.tokenAccountB;

  let info;
  info = await mintA.getAccountInfo(userAccountA.address);
  console.log('userAccount A remains:', info.amount.toNumber());

  info = await mintB.getAccountInfo(userAccountB.address);
  console.log('userAccount B remains:', info.amount.toNumber());

  info = await mintA.getAccountInfo(tokenAccountA);
  console.log('A token account remains:', info.amount.toNumber());

  info = await mintB.getAccountInfo(tokenAccountB);
  console.log('B token account remains:', info.amount.toNumber());

  console.log('Swapping');
  await fetchedTokenSwap.swap(
    userAccountA.address,
    tokenAccountA,
    tokenAccountB,
    userAccountB.address,
    poolAccount,
    userTransferAuthority,
    SWAP_AMOUNT_IN,
    10,
  );

  await sleep(500);

  info = await mintA.getAccountInfo(userAccountA.address);
  console.log('userAccount A remains:', info.amount.toNumber());

  info = await mintB.getAccountInfo(userAccountB.address);
  console.log('userAccount B remains:', info.amount.toNumber());

  info = await mintA.getAccountInfo(tokenAccountA);
  console.log('A token account remains:', info.amount.toNumber());

  info = await mintB.getAccountInfo(tokenAccountB);
  console.log('B token account remains:', info.amount.toNumber());
}
