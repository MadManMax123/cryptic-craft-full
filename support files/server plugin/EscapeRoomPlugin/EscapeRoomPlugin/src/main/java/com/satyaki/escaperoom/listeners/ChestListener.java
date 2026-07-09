package com.satyaki.escaperoom.listeners;

import com.satyaki.escaperoom.systems.RefillSystem;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.*;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.inventory.*;
import org.bukkit.metadata.FixedMetadataValue;
import org.bukkit.plugin.Plugin;

public class ChestListener implements Listener {

    private final Plugin plugin;

    public ChestListener(Plugin plugin) {
        this.plugin = plugin;
    }

    private static final String GUI_TITLE = "Save Refill Chest";

    public static ItemStack getWand() {
        ItemStack wand = new ItemStack(Material.STICK);
        var meta = wand.getItemMeta();
        meta.setDisplayName("§aRefill Wand");
        wand.setItemMeta(meta);
        return wand;
    }

    @EventHandler
    public void onChestClick(PlayerInteractEvent event) {

        Player player = event.getPlayer();

        if (!player.isOp()) return;
        if (event.getItem() == null) return;
        if (!event.getItem().hasItemMeta()) return;
        if (!"§aRefill Wand".equals(event.getItem().getItemMeta().getDisplayName())) return;
        if (event.getClickedBlock() == null) return;
        if (!(event.getClickedBlock().getState() instanceof org.bukkit.block.Container)) return;

        event.setCancelled(true);

        Inventory gui = Bukkit.createInventory(null, 9, GUI_TITLE);

        ItemStack confirm = new ItemStack(Material.LIME_WOOL);
        var meta = confirm.getItemMeta();
        meta.setDisplayName("§aSave Snapshot");
        confirm.setItemMeta(meta);

        gui.setItem(4, confirm);

        player.openInventory(gui);

        player.setMetadata("selectedChest", new FixedMetadataValue(plugin,
                event.getClickedBlock().getLocation()));
    }

    @EventHandler
    public void onGuiClick(InventoryClickEvent event) {

        if (!event.getView().getTitle().equals(GUI_TITLE)) return;

        event.setCancelled(true);

        if (event.getCurrentItem() == null) return;

        if (event.getCurrentItem().getType() == Material.LIME_WOOL) {

            Player player = (Player) event.getWhoClicked();

            Location loc = (Location) player.getMetadata("selectedChest").get(0).value();

            Inventory inv = ((org.bukkit.block.Container) loc.getBlock().getState()).getInventory();

            RefillSystem.saveChest(plugin, loc, inv);

            player.sendMessage("§aSaved chest!");
            player.closeInventory();
        }
    }
}