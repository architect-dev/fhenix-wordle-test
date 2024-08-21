import type { Fheedle } from "../../types";
import hre from "hardhat";

export async function deployFheedleFixture(): Promise<{
  fheedle: Fheedle;
  address: string;
}> {
  const accounts = await hre.ethers.getSigners();
  const contractOwner = accounts[0];

  const Fheedle = await hre.ethers.getContractFactory("Fheedle");
  const fheedle = await Fheedle.connect(contractOwner).deploy();
  await fheedle.waitForDeployment();
  const address = await fheedle.getAddress();
  return { fheedle, address };
}

export async function getTokensFromFaucet() {
  if (hre.network.name === "localfhenix") {
    const signers = await hre.ethers.getSigners();

    if (
      (await hre.ethers.provider.getBalance(signers[0].address)).toString() ===
      "0"
    ) {
      await hre.fhenixjs.getFunds(signers[0].address);
    }
  }
}
