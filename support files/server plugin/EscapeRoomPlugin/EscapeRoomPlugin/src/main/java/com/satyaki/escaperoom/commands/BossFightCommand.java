package com.satyaki.escaperoom.commands;

import com.satyaki.escaperoom.systems.WardenManager;
import org.bukkit.*;
import org.bukkit.boss.*;
import org.bukkit.command.*;
import org.bukkit.entity.Player;
import org.bukkit.entity.Warden;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.BookMeta;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;

public class BossFightCommand implements CommandExecutor {

    private final JavaPlugin plugin;

    public BossFightCommand(JavaPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {

        // ❌ Cooldown check
        if (!WardenManager.canSpawn()) {
            long seconds = WardenManager.getRemainingCooldown() / 1000;
            sender.sendMessage("§cWarden is recovering... wait " + seconds + "s");
            return true;
        }

        World world = Bukkit.getWorld("world");
        if (world == null) return true;

        Location loc = new Location(world, 742, -28, -1140);

        // ❌ Prevent duplicate Warden
        for (Warden w : world.getEntitiesByClass(Warden.class)) {
            if (!w.isDead()) {
                sender.sendMessage("§cWarden already exists!");
                return true;
            }
        }

        // ⚡ Lightning
        world.strikeLightningEffect(loc);

        // 💣 Spawn
        Warden warden = world.spawn(loc, Warden.class);

        world.playSound(loc, Sound.ENTITY_WARDEN_SONIC_BOOM, 2f, 0.5f);

        // 🌑 Player effects
        for (Player player : world.getPlayers()) {
            if (player.getLocation().distance(loc) <= 10) {
                player.sendTitle(
                        "§4§lBOSS FIGHT STARTED",
                        "§cWarden has awakened.",
                        10, 80, 20
                );

                player.addPotionEffect(
                        new org.bukkit.potion.PotionEffect(
                                org.bukkit.potion.PotionEffectType.DARKNESS,
                                200,
                                1
                        )
                );
            }
        }

        // 📊 Boss bar
        BossBar bossBar = Bukkit.createBossBar(
                "§4§lWARDEN",
                BarColor.RED,
                BarStyle.SEGMENTED_20
        );

        for (Player player : Bukkit.getOnlinePlayers()) {
            bossBar.addPlayer(player);
        }

        // 🔄 Health tracking + phase system
        new BukkitRunnable() {

            boolean p75 = false;
            boolean p50 = false;
            boolean p25 = false;

            @Override
            public void run() {

                if (warden.isDead() || !warden.isValid()) {
                    bossBar.removeAll();
                    cancel();
                    return;
                }

                double hp = warden.getHealth();
                double max = warden.getMaxHealth();
                double percent = (hp / max) * 100;

                bossBar.setProgress(Math.max(0, percent / 100));

                // 💀 75%
                if (!p75 && percent <= 75) {
                    p75 = true;
                    dropClue(warden, "X=100");
                }

                // 💀 50%
                if (!p50 && percent <= 50) {
                    p50 = true;
                    dropClue(warden, "Y=198");
                }

                // 💀 25%
                if (!p25 && percent <= 25) {
                    p25 = true;
                    dropClue(warden, "Z=-38");
                }
            }

            private void dropClue(Warden warden, String text) {

                for (int i = 0; i < 4; i++) {

                    ItemStack book = new ItemStack(Material.WRITTEN_BOOK);
                    BookMeta meta = (BookMeta) book.getItemMeta();

                    if (meta == null) return;

                    meta.setTitle("Clue");
                    meta.setAuthor("System");
                    meta.addPage("§e" + text);

                    meta.getPersistentDataContainer().set(
                            new NamespacedKey(plugin, "clue"),
                            PersistentDataType.STRING,
                            text
                    );

                    book.setItemMeta(meta);

                    // ⚡ Spawn item normally
                    org.bukkit.entity.Item itemEntity =
                            warden.getWorld().dropItem(warden.getLocation().add(0, 1.2, 0), book);

                    // 💥 Scatter direction (random burst)
                    double angle = Math.random() * Math.PI * 2;
                    double strength = 0.4 + Math.random() * 0.4;

                    double x = Math.cos(angle) * strength;
                    double z = Math.sin(angle) * strength;
                    double y = 0.35 + Math.random() * 0.25;

                    itemEntity.setVelocity(new org.bukkit.util.Vector(x, y, z));
                    itemEntity.setPickupDelay(20); // small delay so it feels like a "burst"
                }
            }

        }.runTaskTimer(plugin, 0L, 10L);

        return true;
    }
}