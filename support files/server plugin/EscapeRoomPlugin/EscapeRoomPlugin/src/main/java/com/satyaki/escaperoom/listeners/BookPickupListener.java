package com.satyaki.escaperoom.listeners;

import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityPickupItemEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.BookMeta;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.plugin.java.JavaPlugin;

public class BookPickupListener implements Listener {

    private final JavaPlugin plugin;

    public BookPickupListener(JavaPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onPickup(EntityPickupItemEvent event) {

        if (!(event.getEntity() instanceof Player player)) return;

        ItemStack item = event.getItem().getItemStack();
        if (item.getType() != Material.WRITTEN_BOOK) return;

        BookMeta meta = (BookMeta) item.getItemMeta();
        if (meta == null) return;

        // ----------------------------
        // 1) Final Message CHECK
        // ----------------------------
        String title = meta.getTitle();

        if (title != null && title.equalsIgnoreCase("Final Message")) {

            if (hasFinalMessage(player)) {
                event.setCancelled(true);
                player.sendMessage("§cYou can only carry one Final Message!");
                return;
            }

            return; // allow pickup
        }

        // ----------------------------
        // 2) CLUE CHECK (PDC-based)
        // ----------------------------
        String clue = meta.getPersistentDataContainer().get(
                new NamespacedKey(plugin, "clue"),
                PersistentDataType.STRING
        );

        if (clue == null) return;

        if (hasClue(player, clue)) {
            event.setCancelled(true);
            player.sendMessage("§cYou already have this clue!");
        }
    }

    // ----------------------------
    // INVENTORY SCAN HELPERS
    // ----------------------------

    private boolean hasFinalMessage(Player player) {
        for (ItemStack item : player.getInventory().getContents()) {
            if (item == null) continue;
            if (item.getType() != Material.WRITTEN_BOOK) continue;

            BookMeta meta = (BookMeta) item.getItemMeta();
            if (meta == null) continue;

            String title = meta.getTitle();
            if (title != null && title.equalsIgnoreCase("Final Message")) {
                return true;
            }
        }
        return false;
    }

    private boolean hasClue(Player player, String clue) {
        for (ItemStack item : player.getInventory().getContents()) {
            if (item == null) continue;
            if (item.getType() != Material.WRITTEN_BOOK) continue;

            BookMeta meta = (BookMeta) item.getItemMeta();
            if (meta == null) continue;

            String existingClue = meta.getPersistentDataContainer().get(
                    new NamespacedKey(plugin, "clue"),
                    PersistentDataType.STRING
            );

            if (clue.equals(existingClue)) {
                return true;
            }
        }
        return false;
    }
}