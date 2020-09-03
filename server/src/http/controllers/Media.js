
import express from 'express';
import {
  param,
  query,
  validationResult,
} from 'express-validator';
import Container from 'typedi';
import fs from 'fs';
import { difference } from 'lodash';
import asyncMiddleware from '@/http/middleware/asyncMiddleware';

const fsPromises = fs.promises;

export default {
  /**
   * Router constructor.
   */
  router() {
    const router = express.Router();

    router.post('/upload',
      this.upload.validation,
      asyncMiddleware(this.upload.handler));

    router.delete('/',
      this.delete.validation,
      asyncMiddleware(this.delete.handler));

    router.get('/',
      this.get.validation,
      asyncMiddleware(this.get.handler));

    return router;
  },

  /**
   * Retrieve all or the given attachment ids.
   */
  get: {
    validation: [
      query('ids'),
    ],
    async handler(req, res) {
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        return res.boom.badData(null, {
          code: 'validation_error', ...validationErrors,
        });
      }
      const { Media } = req.models;
      const media = await Media.query().onBuild((builder) => {

        if (req.query.ids) {
          const ids = Array.isArray(req.query.ids) ? req.query.ids : [req.query.ids];
          builder.whereIn('id', ids);
        }
      });

      return res.status(200).send({ media });
    },
  },

  /**
   * Uploads the given attachment file.
   */
  upload: {
    validation: [
      // check('attachment').exists(),
    ],
    async handler(req, res) {
      const Logger = Container.get('logger');

      if (!req.files.attachment) {
        return res.status(400).send({
          errors: [{ type: 'ATTACHMENT.NOT.FOUND', code: 200 }],
        });
      }
      const publicPath = 'storage/app/public/';
      const attachmentsMimes = ['image/png', 'image/jpeg'];
      const { attachment } = req.files;
      const { Media } = req.models;

      const errorReasons = [];

      // Validate the attachment.
      if (attachment && attachmentsMimes.indexOf(attachment.mimetype) === -1) {
        errorReasons.push({ type: 'ATTACHMENT.MINETYPE.NOT.SUPPORTED', code: 160 });
      }
      // Catch all error reasons to response 400.
      if (errorReasons.length > 0) {
        return res.status(400).send({ errors: errorReasons });
      }

      try {
        await attachment.mv(`${publicPath}${req.organizationId}/${attachment.md5}.png`);
        Logger.info('[attachment] uploaded successfully');
      } catch (error) {
        Logger.info('[attachment] uploading failed.', { error });
      }

      const media = await Media.query().insert({
        attachment_file: `${attachment.md5}.png`,
      });
      return res.status(200).send({ media });
    },
  },

  /**
   * Deletes the given attachment ids from file system and database.
   */
  delete: {
    validation: [
      query('ids').exists().isArray(),
      query('ids.*').exists().isNumeric().toInt(),
    ],
    async handler(req, res) {
      const Logger = Container.get('logger');
      const validationErrors = validationResult(req);

      if (!validationErrors.isEmpty()) {
        return res.boom.badData(null, {
          code: 'validation_error', ...validationErrors,
        });
      }
      const { Media, MediaLink } = req.models;
      const ids = Array.isArray(req.query.ids) ? req.query.ids : [req.query.ids];
      const media = await Media.query().whereIn('id', ids);
      const mediaIds = media.map((m) => m.id);
      const notFoundMedia = difference(ids, mediaIds);

      if (notFoundMedia.length) {
        return res.status(400).send({
          errors: [{ type: 'MEDIA.IDS.NOT.FOUND', code: 200, ids: notFoundMedia }],
        });
      }
      const publicPath = 'storage/app/public/';
      const tenantPath = `${publicPath}${req.organizationId}`;
      const unlinkOpers = [];

      media.forEach((mediaModel) => {
        const oper = fsPromises.unlink(`${tenantPath}/${mediaModel.attachmentFile}`);
        unlinkOpers.push(oper);
      });
      await Promise.all(unlinkOpers).then((resolved) => {
        resolved.forEach(() => {
          Logger.info('[attachment] file has been deleted.');
        }); 
      })
      .catch((errors) => {
        errors.forEach((error) => {
          Logger.info('[attachment] Delete item attachment file delete failed.', { error });
        })
      });

      await MediaLink.query().whereIn('media_id', mediaIds).delete();
      await Media.query().whereIn('id', mediaIds).delete();

      return res.status(200).send();
    },
  },
};
