/* eslint-disable eqeqeq */
/* eslint-disable quotes */
const path = require('path');
const express =require('express');
const xss = require('xss');
const logger = require('../logger');
const jsonParser = express.json();
const foldersRouter = express.Router();
const FoldersService = require('./folders-service');

const serializeFolder = folder => ({
  id: folder.id,
  name: xss(folder.name)
});

foldersRouter
    .route('/')
    .get((req, res, next) => {
      const knexInstance = req.app.get('db');
      FoldersService.getAllFolders(knexInstance)
        .then(folders => {
            if(!folders) {
              return res.status(400).json({
                error: { message: `Folder doesn't exist` }
              });
            }
          res.json(folders.map(serializeFolder));
        })
        .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
      const { folder_name } = req.body;
      const newFolder = { folder_name };

      if(!folder_name){
        logger.error(`POST ${req.originalUrl} : Missing key 'folder_name in request body`);
        return res.status(400).json({
          error: { message: `Missing 'folder_name' in request body`}
        });
      }

      const knexInstance = req.app.get('db');
      FoldersService.insertFolder(knexInstance,newFolder)
        .then(folder => {
          res
            .status(201)
            .location(path.posix.join(req.originalUrl + `/${folder.id}`))
            .json(serializeFolder(folder));
        })
        .catch(next);
    });


  foldersRouter
  .route('/:id')
  .all((req, res, next) => {

      const knexInstance = req.app.get('db');
      FoldersService.getById(knexInstance, req.params.id)
        .then(folder => {
          if(!folder) {
             logger.error(`ALL ${req.originalUrl} : Folder with id ${req.params.id} not found`);
             return res.status(404).json({
                error: { message: `Folder doesn't exist` }
            });
          }
          res.folder = folder;
          next();
        })
        .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeFolder(res.folder));
  })
  .delete((req, res, next) => {
      const knexInstance = req.app.get('db');
      FoldersService.deleteFolder(knexInstance, req.params.folder_id)
      .then( () => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { folder_name } = req.body;
    const folderToUpdate = { folder_name };

   //folder name is required
    if (!folder_name) {
      logger.error(`PATCH ${req.originalUrl} : Missing key in request body`);
      return res.status(400).json({
          error: { message: `Missing key 'folder_name' in request body`}
      });
    }
    
    const knexInstance = req.app.get('db');
    FoldersService.updateFolder(
      knexInstance,
      req.params.folder_id,
      serializeFolder(folderToUpdate)
    )
      .then( () => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;