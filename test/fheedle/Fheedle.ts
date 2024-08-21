import { createFheInstance } from "../../utils/instance";
import type { Signers } from "../types";
import { shouldBehaveLikeFheedle } from "./Fheedle.behavior";
import { deployFheedleFixture, getTokensFromFaucet } from "./Fheedle.fixture";
import hre from "hardhat";

describe("Fheedle Unit Tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    // get tokens from faucet if we're on localfhenix and don't have a balance
    await getTokensFromFaucet();
    // deploy test contract
    const { fheedle, address } = await deployFheedleFixture();
    this.fheedle = fheedle;

    // initiate fhenixjs
    this.instance = await createFheInstance(hre, address);

    // set admin account/signer
    const signers = await hre.ethers.getSigners();
    this.signers.admin = signers[0];
  });

  describe("Fheedle", function () {
    shouldBehaveLikeFheedle();
  });
});
