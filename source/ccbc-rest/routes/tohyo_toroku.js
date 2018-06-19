const request = require('superagent')
const express = require('express')
const router = express.Router()
const async = require('async')
const db = require('./common/sequelize_helper.js').sequelize
const bcdomain = require('./common/constans.js').bcdomain

router.post('/find', (req, res) => {
  var sql =
    'select tsen.t_senkyo_pk as t_senkyo_pk, tsen.senkyo_nm as senkyo_nm, tsen.tohyo_kaishi_dt as tohyo_kaishi_dt,' +
    ' tsen.tohyo_shuryo_dt as tohyo_shuryo_dt, tsen.haifu_coin as haifu_coin, tpre.t_presenter_pk as t_presenter_pk, ' +
    ' tpre.title as title, tsha.t_shain_pk as t_shain_pk, tsha.shimei as shimei, tsha.image_file_nm as image_file_nm, tsha.bc_account as bc_account, tshu.t_shussekisha_pk  as t_shussekisha_pk' +
    ' from t_senkyo tsen' +
    ' inner join t_presenter tpre on tsen.t_senkyo_pk = tpre.t_senkyo_pk' +
    ' inner join t_shain tsha on tpre.t_shain_pk = tsha.t_shain_pk' +
    ' left join t_shussekisha tshu on tsen.t_senkyo_pk = tshu.t_senkyo_pk and tshu.t_shain_pk = :mypk' +
    " where tsen.delete_flg = '0'  and tpre.delete_flg = '0' and tsha.delete_flg = '0' and tshu.delete_flg = '0'" +
    ' and exists (select 1 from t_senkyo tsen2 inner join t_shussekisha tshu2 on tsen2.t_senkyo_pk = tshu2.t_senkyo_pk' +
    " where tsen2.delete_flg = '0' and tshu2.delete_flg = '0' and tshu2.t_shain_pk = :mypk)" +
    " and not exists (select 1 from t_tohyo ttoh where ttoh.delete_flg = '0' and ttoh.t_presenter_pk = tpre.t_presenter_pk and ttoh.t_shussekisha_pk = tshu.t_shussekisha_pk and ttoh.transaction_id is not null)" +
    ' and current_date between tsen.tohyo_kaishi_dt and tsen.tohyo_shuryo_dt and tpre.t_shain_pk <> :mypk'
  db
    .query(sql, {
      replacements: { mypk: req.body.tShainPk },
      type: db.QueryTypes.RAW
    })
    .spread((datas, metadata) => {
      console.log('★★★')
      console.log(datas)
      res.json({ status: true, data: datas })
    })
})

router.post('/create', (req, res) => {
  console.log('◆◆◆')
  var resultList = req.body.resultList

  db
    .transaction(async function(tx) {
      var resdatas = []
      for (var i in resultList) {
        var resdata = resultList[i]
        console.log('◆１')

        var t_tohyo_pk = await dbinsert(tx, resdatas, resdata, req, i)
        var transaction_id = await bcrequest()
        await dbupdate(tx, t_tohyo_pk, transaction_id)
      }

      res.json({ status: true, data: resdatas })
    })
    .then(result => {
      // コミットしたらこっち
      console.log('正常')
    })
    .catch(e => {
      // ロールバックしたらこっち
      console.log('異常')
      console.log(e)
    })
})

function dbinsert(tx, resdatas, resdata, req, i) {
  return new Promise((resolve, reject) => {
    var sql =
      'insert into t_tohyo (t_presenter_pk, t_shussekisha_pk, hyoka1, hyoka2, hyoka3, hyoka4, hyoka5, hyoka_comment, transaction_id, delete_flg, insert_user_id, insert_tm) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING t_tohyo_pk'
    db
      .query(sql, {
        transaction: tx,
        replacements: [
          resdata.t_presenter_pk,
          resdata.t_shussekisha_pk,
          req.body.activeStep1[i] + 1,
          req.body.activeStep2[i] + 1,
          req.body.activeStep3[i] + 1,
          req.body.activeStep4[i] + 1,
          req.body.activeStep5[i] + 1,
          req.body.comment[i],
          null,
          '0',
          null,
          null
        ]
      })
      .spread((datas, metadata) => {
        console.log('◆３')
        console.log(datas)
        resdatas.push(datas)
        return resolve(datas[0].t_tohyo_pk)
      })
  })
}

function bcrequest() {
  return new Promise((resolve, reject) => {
    request.post(bcdomain + '/bc-api/add_account').end((err, res) => {
      console.log('★★★')
      if (err) {
        console.log('★' + err)
        return
      }
      // 検索結果表示
      console.log('★★★' + res)
      return resolve(res.body.bc_account)
    })
  })
}

function dbupdate(tx, t_tohyo_pk, transaction_id) {
  return new Promise((resolve, reject) => {
    var sql2 = 'update t_tohyo set transaction_id = ? where t_tohyo_pk = ?'
    db
      .query(sql2, {
        transaction: tx,
        replacements: [transaction_id, t_tohyo_pk]
      })
      .spread((datas, metadata) => {
        console.log(datas)
        return resolve(datas)
      })
  })
}

router.post('/findA', (req, res) => {
  // プルダウン用のマスタ読み込み
  request.post(bcdomain + '/bc-api/add_account').end((err, res) => {
    console.log('★★★')
    if (err) {
      console.log('★' + err)
      return
    }
    // 検索結果表示
    console.log('★★★' + res)
  })

  console.log('OK')
  console.log(req.params)

  db
    .transaction(async function(tx) {
      await db
        .query('select * from test', { transaction: tx })
        .spread((datas, metadata) => {
          console.log(datas)
          res.json({ status: true, data: datas })
        })
      // このあとにawait sequelizeXXXXを記載することで連続して処理をかける
    })
    .then(result => {
      // コミットしたらこっち
      console.log('正常')
    })
    .catch(() => {
      // ロールバックしたらこっち
      console.log('異常')
    })
})

module.exports = router
