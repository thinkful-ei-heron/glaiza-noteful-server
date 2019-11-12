/* eslint-disable eqeqeq */
/* eslint-disable quotes */
const path = require('path');
const express =require('express');
const xss = require('xss');
const notesRouter = express.Router();
const jsonParser = express.json();

const NotesService = require('./notes-service');

const serializeNote = note => ({
  id: note.id,
  name: xss(note.name),
  modified: note.modified,
  folderId: note.folderId,
  content: xss(note.content),
});

notesRouter
    .route('/')
    .get((req, res, next) => {
      const knexInstance = req.app.get('db');
      NotesService.getAllNotes(knexInstance)
        .then(notes => {
            if(!notes) {
              return res.status(400).json({
                error: { message: `Note doesn't exist` }
              });
            }
          res.json(notes.map(serializeNote));
        })
        .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
      const { name, folderId, content } = req.body;
      const newNote = { name, folderId, content};

      //each value in new note is required, verify that they were sent
      for (const [key, value] of Object.entries(newNote)) {
        if (value == null) {
          return res.status(400).json({
            error: { message: `Missing '${key}' in request body` }
          });
        }
      }

      const knexInstance = req.app.get('db');
      NotesService.insertNote(knexInstance, newNote)
        .then(note => {
          res
            .status(201)
            .location(path.posix.join(req.originalUrl + `/${note.id}`))
            .json(serializeNote(note));
        })
        .catch(next);
    });


  notesRouter
  .route('/:note_id')
  .all((req, res, next) => {

      const knexInstance = req.app.get('db');
      NotesService.getById(knexInstance, req.params.note_id)
        .then(note => {
          if(!note) {
            return res.status(404).json({
              error: { message: `Note doesn't exist` }
            });
          }
          res.note = note;
          next();
        })
        .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
      const knexInstance = req.app.get('db');
      NotesService.deleteNote(knexInstance, req.params.note_id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, folderId, content } = req.body;
    const noteToUpdate = { name, folderId, content };

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must content either 'name', 'folderId' or 'content'`
        }
      });

    noteToUpdate.modified = new Date();

    const knexInstance = req.app.get('db');
    NotesService.updateNote(
      knexInstance,
      req.params.note_id,
      noteToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;