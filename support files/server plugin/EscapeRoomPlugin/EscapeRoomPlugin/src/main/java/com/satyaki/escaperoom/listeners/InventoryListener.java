package com.satyaki.escaperoom.listeners;

import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.ItemStack;

public class InventoryListener implements Listener {

    @EventHandler
    public void onClick(InventoryClickEvent event) {

        if (!(event.getWhoClicked() instanceof Player player)) return;

        // ✅ OP bypass
        if (player.isOp()) return;

        ItemStack item = event.getCurrentItem();

        if (item == null) return;

        // ❌ Block taking paper
        if (item.getType() == Material.PAPER) {
            event.setCancelled(true);
        }
    }

    @EventHandler
    public void onDrag(InventoryDragEvent event) {

        if (!(event.getWhoClicked() instanceof Player player)) return;

        if (player.isOp()) return;

        for (ItemStack item : event.getNewItems().values()) {

            if (item != null && item.getType() == Material.PAPER) {
                event.setCancelled(true);
                return;
            }
        }
    }
}