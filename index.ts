import axios from "axios";
import * as fs from "fs";
import * as readline from "readline";
import { Keyring } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { cryptoWaitReady, mnemonicToMiniSecret } from "@polkadot/util-crypto";

let nft_count = 0;
let claimed_amount = 0;
const claimed_accounts = new Array<string>();

function getCurrentUnixTimestamp() {
  const currentUnixTimestamp = Math.floor(Date.now() / 1000);
  return currentUnixTimestamp;
}

async function availCheck(mnemonic: string) {
  const miniSecret = mnemonicToMiniSecret(mnemonic);
  const privateKey = u8aToHex(miniSecret);

  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(privateKey);
  const pk = Buffer.from(keypair.publicKey).toString("hex");

  const ts = getCurrentUnixTimestamp();
  const message = `Greetings from Avail!\n\nSign this message to check your eligibility. This signature will not cost you any fees.\n\nTimestamp: ${ts}`;
  const signature = u8aToHex(keypair.sign(message));

  const payload = {
    account: `0x${pk}`,
    type: "AVAIL",
    timestamp: ts,
    signedMessage: signature,
  };

  console.info("Checking Account:", keypair.address);

  const url = "https://claim-api.availproject.org/check-rewards";
  const res = await axios.post(url, payload);
  if (res.data?.message == "Already Claimed") {
    const data = res.data.data;
    claimed_amount += data.claimed_by[0].amount;
    console.info(
      `Checking Account: ${keypair.address}, Claimed Amount: ${data.claimed_by[0].amount}`
    );
    claimed_accounts.push(mnemonic);
  } else if (res.data?.message == "Not Eligible") {
    console.info(`Checking Account: ${keypair.address}, Not Eligible`);
  } else {
    console.info(res.status, JSON.stringify(res.data));
  }

  if (res.data?.nft) {
    nft_count += 1;
    console.info(
      `Checking Account: ${keypair.address}, NFT: ${res.data?.nft.nft_type}`
    );
  }

  return keypair.address;
}

(async () => {
  await cryptoWaitReady();

  const rl = readline.createInterface({
    input: fs.createReadStream("mnemonics.txt"),
  });

  const mnemonics = new Array<string>();
  for await (const line of rl) {
    if (line.length > 0) {
      mnemonics.push(line);
    }
  }

  const addresses = new Array<string>();
  for (let mnemonic of mnemonics) {
    const address = await availCheck(mnemonic);
    addresses.push(address);
  }

  console.info("NFT Count:", nft_count);
  console.info("Claimed Amount:", claimed_amount);
})();
