package com.satyaki.coderewards;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.player.AsyncPlayerChatEvent;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class CodeListener implements Listener {

    private static final Set<UUID> waiting = new HashSet<>();

    @EventHandler
    public void onClick(InventoryClickEvent e) {
        if (e.getView().getTitle().equals("Use Code")) {
            e.setCancelled(true);

            if (e.getCurrentItem() == null) return;

            waiting.add(e.getWhoClicked().getUniqueId());
            e.getWhoClicked().closeInventory();
            e.getWhoClicked().sendMessage("§eType your code in chat now!");
        }
    }

    @EventHandler
    public void onChat(AsyncPlayerChatEvent e) {
        if (!waiting.contains(e.getPlayer().getUniqueId())) return;

        e.setCancelled(true);

        boolean success = CodeManager.useCode(e.getMessage(), e.getPlayer());

        if (success) {
            e.getPlayer().sendMessage("§aCode redeemed!");
        } else {
            e.getPlayer().sendMessage("§cInvalid or already used code!");
        }

        waiting.remove(e.getPlayer().getUniqueId());
    }
}