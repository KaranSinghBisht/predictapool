// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";
import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";
import {MockERC20} from "../src/tokens/MockERC20.sol";

/// @notice Adds Brazil + Draw deposits to the live v2 event from two throwaway
/// wallets so the outcome split is realistic (~50/35/15) instead of 100% Argentina.
/// Keys are derived in-script from public labels (valueless testnet wallets).
contract SeedV2Odds is Script {
    address constant HOOK = 0x26b7228e75c5Ba4f256aa88b7141290518D70Ac0;
    address constant TOKEN0 = 0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6; // ppUSDC
    address constant TOKEN1 = 0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12; // ppWETH
    bytes32 constant EVENT_ID = 0x8e7d3d968700fe8f2e70bd7e29ab516930388419d00a6133a266bc504435a38b;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        Vm.Wallet memory wBra = vm.createWallet("predictapool-seed-brazil");
        Vm.Wallet memory wDraw = vm.createWallet("predictapool-seed-draw");

        // 1. Deployer funds gas + mints tokens to the two seed wallets.
        vm.startBroadcast(deployerKey);
        (bool g1,) = wBra.addr.call{value: 0.02 ether}("");
        (bool g2,) = wDraw.addr.call{value: 0.02 ether}("");
        require(g1 && g2, "gas funding failed");
        MockERC20(TOKEN0).mint(wBra.addr, 3500e18);
        MockERC20(TOKEN1).mint(wBra.addr, 3500e18);
        MockERC20(TOKEN0).mint(wDraw.addr, 1500e18);
        MockERC20(TOKEN1).mint(wDraw.addr, 1500e18);
        vm.stopBroadcast();

        // 2. Brazil-backer predicts outcome 2.
        vm.startBroadcast(wBra.privateKey);
        MockERC20(TOKEN0).approve(HOOK, type(uint256).max);
        MockERC20(TOKEN1).approve(HOOK, type(uint256).max);
        PredictaPoolHook(HOOK).predict(EVENT_ID, 2, 3500e18, 3500e18);
        vm.stopBroadcast();

        // 3. Draw-backer predicts outcome 1.
        vm.startBroadcast(wDraw.privateKey);
        MockERC20(TOKEN0).approve(HOOK, type(uint256).max);
        MockERC20(TOKEN1).approve(HOOK, type(uint256).max);
        PredictaPoolHook(HOOK).predict(EVENT_ID, 1, 1500e18, 1500e18);
        vm.stopBroadcast();

        console.log("Brazil backer:", wBra.addr);
        console.log("Draw backer:", wDraw.addr);
    }
}
