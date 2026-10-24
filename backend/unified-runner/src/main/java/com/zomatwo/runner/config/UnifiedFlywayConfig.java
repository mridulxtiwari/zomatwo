package com.zomatwo.runner.config;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
@Slf4j
public class UnifiedFlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            log.info("Starting unified Flyway database migrations across all service schemas...");

            migrateSchema(dataSource, "flyway_identity_history", "classpath:db/migration/identity", "Identity");
            migrateSchema(dataSource, "flyway_catalog_history", "classpath:db/migration/catalog", "Catalog");
            migrateSchema(dataSource, "flyway_order_history", "classpath:db/migration/order", "Order");
            migrateSchema(dataSource, "flyway_payment_history", "classpath:db/migration/payment", "Payment");

            log.info("All unified Flyway migrations completed successfully!");
        };
    }

    private void migrateSchema(DataSource dataSource, String tableName, String location, String moduleName) {
        log.info("Migrating {} module using table '{}' from '{}'...", moduleName, tableName, location);
        Flyway.configure()
                .dataSource(dataSource)
                .table(tableName)
                .locations(location)
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .outOfOrder(true)
                .load()
                .migrate();
        log.info("{} module migration completed successfully.", moduleName);
    }
}
