package com.satyaki.escaperoom.listeners;

import org.bukkit.Material;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerInteractEvent;

public class InteractListener implements Listener {

    @EventHandler
    public void onInteract(PlayerInteractEvent event) {

        if (event.getPlayer().isOp()) return;
        if (event.getItem() == null) return;

        Material item = event.getItem().getType();

        // ✅ Allow TNT ignition tools
        if (item == Material.FLINT_AND_STEEL || item == Material.FIRE_CHARGE) {
            event.setCancelled(false);
        }
    }
}