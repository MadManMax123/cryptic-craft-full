package com.satyaki.coderewards;

import org.bukkit.Location;
import org.bukkit.NamespacedKey;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.persistence.PersistentDataType;

public class WandListener implements Listener {

    private final NamespacedKey key =
            new NamespacedKey(CodeRewardsPlugin.getInstance(), "tp_wand");

    @EventHandler
    public void onUse(PlayerInteractEvent e) {

        if (e.getItem() == null) return;

        ItemStack item = e.getItem();
        if (!item.hasItemMeta()) return;

        var meta = item.getItemMeta();

        if (!meta.getPersistentDataContainer().has(key, PersistentDataType.INTEGER)) return;

        Player player = e.getPlayer();

        // 📍 teleport location
        Location loc = new Location(player.getWorld(), 701, 99, -1174);
        loc.getChunk().load();

        player.teleport(loc);
        player.sendMessage("§aWoosh! Teleported!");

        // 🧨 consume item (one-time use)
        item.setAmount(item.getAmount() - 1);
    }
}