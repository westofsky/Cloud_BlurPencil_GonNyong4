var express = require('express');
var router = express.Router();

var User = require('../schemas/user');
var Work = require('../schemas/work');
var Folder = require('../schemas/folder');


/**
 * 폴더 생성
 * POST /api/folders
 */
router.post('/', function(req, res, next) {
	const folder = new Folder({
		folderName: req.body.folderName,
		owner: req.body.owner
	});
	
	folder.save()
		.then((result) => {
			res.json(200, { success:true, message:'폴더 생성에 성공했습니다.' });
		})
		.catch((err) => {
			console.error(err);
			next(err);
		});
});

/*
	GET /api/folders
	user의 폴더들 가져오기
*/
router.get('/', function(req, res, next) {
	const user_oid = req.query.user_oid;
	
	Folder.find({ owner: user_oid }).populate('share', 'user_id')
		.then((result) => {
			res.json(200, result);
		})
		.catch((err) => {
			console.error(err);
			next(err);
		})
});

/*
	GET /api/folders/sharing
	폴더의 공유된 유저들 정보 가져오기
*/
router.get('/sharing', function(req, res, next) {
	const folder_oid = req.query.folder_oid;
	
	Folder.findOne({ _id: folder_oid }, { share: true }).populate('share', 'user_id')
		.then((result) => {
			res.json(200, result.share);
		})
		.catch((err) => {
			console.error(err);
			next(err);
		})
});

/*
	GET /api/folders/shared
	user의 공유된 폴더들 가져오기
*/
router.get('/shared', function(req, res, next) {
	const user_oid = req.query.user_oid;
	
	Folder.find({ share: user_oid }).populate('share', 'user_id')
		.then((result) => {
			res.json(200, result);
		})
		.catch((err) => {
			console.error(err);
			next(err);
		})
});
/*
	GET /api/folders/files
	폴더안 파일들 가져오기
*/
router.get('/files/:folder_oid', function(req, res, next) {
	const folder_oid = req.params.folder_oid || '';
	console.log('foid ', folder_oid);
	
	Work.find({ folder: folder_oid })
		.then((result) => {
			result.success = true;
			res.json(200, result);
		})
		.catch((err) => {
			console.error(err);
			next(err);
		})
});

/*
	POST /api/folders/delete
	폴더 삭제
*/
router.post('/delete', function(req, res, next) {
	const owner = req.body.owner, 
		  folder_oid = req.body.folder_oid;
	
	// TODO : 폴더를 삭제하면 관련된 파일들도 삭제할지 or 폴더만 삭제할지
	
	Folder.deleteOne({ owner: owner, _id: folder_oid })
		.then((result) => {
			console.log(result);
			if (result && result.deletedCount > 0 && result.n > 0)
				res.json(200, { success:true, message:`${folder_oid} : 폴더 삭제`});
			else
				res.json(200, { success:false, message:`주인 또는 폴더가 올바르지 않습니다.`});
		})
		.catch((err) => {
			console.error(err);
			next(err);
		})
});

/*
	POST /api/folders/share
	폴더 공유
*/
router.post('/share', function(req, res, next) {
	const share_email = req.body.email;
	const folder_oid = req.body.folder_oid;
	
	User.findOne({ user_email: share_email }, { _id: true })
		.then((result) => {
			console.log('share ', result);
			if (result)
				return Folder.updateOne({ _id: folder_oid }, { $push: { share: result._id } });
			else
				return { success:false, message:`존재하지 않는 이메일 유저입니다.` };
		})
		.then((result) => {
			console.log('SHARE ', result);
			if (result.ok)
				res.json(200, { success:true, message:`${share_email} 님에게 폴더를 공유했습니다.` });
			else
				res.json(200, result);
		})
});

/*
	POST /api/folders/unshare
	폴더 공유 해제
*/
router.post('/unshare', function(req, res, next) {
	const share_id = req.body.share_id;
	const folder_oid = req.body.folder_oid;
	
	User.findOne({ user_id: share_id }, { _id: true })
		.then((result) => {
			if (result)
				return Folder.updateOne({ _id: folder_oid }, { $pull: { share: result._id } });
			else
				return { success:false, message:`존재하지 않는 이메일 유저입니다.` };
		})
		.then((result) => {
			console.log('UNSHARE ', result);
			if (result.ok)
				res.json(200, { success:true, message:`${share_id} 님의 폴더 공유를 해제했습니다.` });
			else
				res.json(200, result);
		})
});


module.exports = router;
