const express = require('express');
const formidable = require('express-formidable');
const { authRefreshMiddleware, getHubs, getProjects, getProjectContents, getItemVersions,translateObject,getManifest, getDerivativeManifest } = require('../services/aps.js');


let router = express.Router();

router.use('/api', authRefreshMiddleware);

router.get('/api/hubs', async function (req, res, next) {
    try {
        const hubs = await getHubs(req.internalOAuthToken);
        res.json(hubs);
    } catch (err) {
        next(err);
    }
});

router.get('/api/hubs/:hub_id/projects', async function (req, res, next) {
    try {
        const projects = await getProjects(req.params.hub_id, req.internalOAuthToken);
        res.json(projects);
    } catch (err) {
        next(err);
    }
});

router.get('/api/hubs/:hub_id/projects/:project_id/contents', async function (req, res, next) {
    try {
        const contents = await getProjectContents(req.params.hub_id, req.params.project_id, req.query.folder_id, req.internalOAuthToken);
        res.json(contents);
    } catch (err) {
        next(err);
    }
});

router.get('/api/hubs/:hub_id/projects/:project_id/contents/:item_id/versions', async function (req, res, next) {
    try {
        const versions = await getItemVersions(req.params.project_id, req.params.item_id, req.internalOAuthToken);
        
        res.json(versions)

    } catch (err) {
        next(err);
    }
});

router.post('/api/designdata/job', formidable(), async function (req, res, next) {
    const urn = req.fields['urn'];
    if (!urn) {
        res.status(400).send('The required urn is missing.');
        return;
    }
    try {
        const result = await translateObject(urn, req.internalOAuthToken);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.get('/api/designdata/:urn/manifest/:derivativeUrn', async function (req, res, next) {
    try {
        const decodedDerivativeUrn = decodeURIComponent(req.params.derivativeUrn) 
        const derivativeManifest = await getDerivativeManifest(req.params.urn, decodedDerivativeUrn,  req.internalOAuthToken);
        res.json(derivativeManifest)

    } catch (err) {
        next(err);
    }
});

router.get('/api/designdata/:urn/status', async function (req, res, next) {
    try {
        const manifest = await getManifest(req.params.urn, req.internalOAuthToken);
        if (manifest) {
            let messages = [];
            if (manifest.derivatives) {
                for (const derivative of manifest.derivatives) {
                    messages = messages.concat(derivative.messages || []);
                    if (derivative.children) {
                        for (const child of derivative.children) {
                            messages.concat(child.messages || []);
                        }
                    }
                }
            }
            res.json({ status: manifest.status, derivatives: manifest.derivatives, progress: manifest.progress, messages });
        } else {
            res.json({ status: 'n/a' });
        }
    } catch (err) {
        next(err);
    }
});


module.exports = router;
