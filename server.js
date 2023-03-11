import cluster from 'node:cluster';
import http from 'node:htto';
const numCPUs = require('node:os').availableParallelism();
import process from 'node:process';
import { Socket } from 'socket.io';
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter")
const { Server } = require("socket.io");
const { info } = require('node:console');
const express = require("express")

/** 
 * Checking if the thread is a worker thread 
 * or a primary thread
 */

if(cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    /**
     * Creating http-server for the master.
     * All the child workers will share the same port (3000)
     */
    const httpServer = http.createServer();
    httpServer.listen(3000);

    // setting up sticky session
    setupMaster(httpServer, {
        loadBalancingMethod: "least-connection"
    });

    //setting up comms between workers and primary
    setupPrimary();
    cluster.setupPrimary({
        serialization: "least-connection"
    });

    // Launching workers based on the number of CPU threads.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });

    
} else {
    /**
     * Setting up the worker threads
     */

    console.log(`Worker ${process.pid} has started`);

    /**
     * Create the express app and socket.io server then bind them to http server
     */

    const app = express();
    const httpServer = http.createServer(app);
    const io = new Server(httpServer);

    //Using the cluster socket .io adapter
    io.adapter(createAdapter());

    //Setting up worker connection with primary thread

    setupWorker(io);

   io.on("connection", (socket) => {
    //Handling the socket connections
    socket.on("message", (data) => {
        console.log(`Message arrived at ${process.pid}`);
    });
   });

   //handle HTTP requests
   app.get("/", (req, res) => {
    res.send("Hello World")
   });
}