
const FoldersService = {
    getAllFolders(knex) {
        return knex.select('*').from('folders');
    },
    insertFolder(knex, newFolder) {
        return knex
        .insert(newFolder)
        .into('folders')
        .returning('*')
        .then(rows => {
            return rows[0];//return object of inserted folder
        });
    },
    getById(knex, id) {
        return knex
            .from('folders')
            .select('*')
            .where('folderid', id)
            .first();
    },
    deleteFolder(knex, id) {
        return knex('folders')
          .where('folderid', id)
          .delete();
    },
    updateFolder(knex, id, newFolderFields) {
        return knex('folders')
          .where('folderid', id)
          .update(newFolderFields);
    },

};

module.exports = FoldersService;