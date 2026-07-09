package com.satyaki.escaperoom.listeners;

import com.satyaki.escaperoom.systems.WardenManager;
import org.bukkit.*;
import org.bukkit.entity.Warden;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.BookMeta;

public class WardenDeathListener implements Listener {

    @EventHandler
    public void onWardenDeath(EntityDeathEvent event) {

        if (!(event.getEntity() instanceof Warden)) return;

        // ✅ Record death for cooldown
        WardenManager.recordDeath();

        // ❌ Remove normal drops
        event.getDrops().clear();

        Location loc = event.getEntity().getLocation();
        World world = loc.getWorld();

        // 📚 Create 4 books
        for (int i = 1; i <= 4; i++) {

            ItemStack book = new ItemStack(Material.WRITTEN_BOOK);
            BookMeta meta = (BookMeta) book.getItemMeta();

            meta.setTitle("Final Message");
            meta.setAuthor("Unknown");

            meta.addPage("""
                    Hope you got some of those pages... you might need them later on.
                    
                    Good luck Operator!
                    """);

            meta.addPage("""
                    FLAG{TUNNEL_FACILITY}
                    
                    nodecompiler.vercel.app
                    
                    Keep going...
                    """

            );

            book.setItemMeta(meta);

            world.dropItemNaturally(loc, book);
        }

        // ⚡ Effect
        world.strikeLightningEffect(loc);
    }
}