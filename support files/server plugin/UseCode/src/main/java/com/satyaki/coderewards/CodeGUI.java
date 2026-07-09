package com.satyaki.coderewards;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

public class CodeGUI {

    public static void open(Player player) {

        Inventory inv = Bukkit.createInventory(null, 27, "Use Code");

        ItemStack paper = new ItemStack(Material.PAPER);
        ItemMeta meta = paper.getItemMeta();
        meta.setDisplayName("§aEnter Code");
        paper.setItemMeta(meta);

        inv.setItem(13, paper);

        player.openInventory(inv);
    }
}