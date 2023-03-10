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
    setupPrimary
}