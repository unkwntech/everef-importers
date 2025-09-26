module.exports = {
    apps: [
        {
            name: "worker",
            script: "build/main.js",
            time: true,
            instances: 8,
            autorestart: true,
            max_restarts: 50,
            watch: ["build/main.js", "build/processors/collector.processor.js"],
            // max_memory_restart: "200M",
            appendEnvToName: true,
            namespace: "everef",
            env_production: {
                NODE_ENV: "production",
            },
            env_debug: {
                NODE_ENV: "debug",
            },
        },
        {
            name: "collector",
            script: "build/collectors.js",
            time: true,
            instances: 1,
            autorestart: true,
            max_restarts: 50,
            watch: true,
            max_memory_restart: "200M",
            appendEnvToName: true,
            namespace: "everef",
            env_production: {
                NODE_ENV: "production",
            },
            env_debug: {
                NODE_ENV: "debug",
            },
        },
    ],
    deploy: {
        production: {
            //     user: "github",
            //     host: "ibns.tech",
            //     key: "deploy.key",
            //     ref: "origin/main",
            //     repo: "https://github.com/unkwntech/everef-importers.git",
            //     path: "/var/projects/shhhrelay-backend-prod/",
            //     "post-deploy":
            //         "npm i && tsc -b && pm2 reload ecosystem.config.js --env production && pm2 save",
            //     env: {
            //         NODE_ENV: "production",
            //     },
        },
        debug: {
            ref: "origin/main",
            repo: "https://github.com/unkwntech/everef-importers.git",
            path: "/mnt/c/Users/Arron/Documents/GitHub/everef-importers/",
            "post-deploy":
                "npm i && tsc -b && pm2 reload ecosystem.config.js --env production && pm2 save",
            env: {
                NODE_ENV: "debug",
            },
        },
    },
};
