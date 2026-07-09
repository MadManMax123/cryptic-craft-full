package com.satyaki.escaperoom.listeners;

import org.bukkit.GameMode;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.inventory.EquipmentSlot;

public class PlaceOverrideListener implements Listener {

    @EventHandler
    public void onInteract(PlayerInteractEvent event) {

        if (event.getHand() != EquipmentSlot.HAND) return;

        if (event.getPlayer().isOp()) return;

        if (event.getItem() == null) return;

        Material item = event.getItem().getType();

        // ✅ Only allow TNT & Lever
        if (item != Material.TNT && item != Material.LEVER) return;

        if (event.getClickedBlock() == null) return;

        Block target = event.getClickedBlock().getRelative(event.getBlockFace());

        // Place block manually
        target.setType(item);

        // Remove one item
        event.getItem().setAmount(event.getItem().getAmount() - 1);

        event.setCancelled(true);
    }
}