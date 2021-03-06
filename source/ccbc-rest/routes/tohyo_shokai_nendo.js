const request = require('superagent')
const express = require('express')
const router = express.Router()
const async = require('async')
const db = require('./common/sequelize_helper.js').sequelize
const bcdomain = require('./common/constans.js').bcdomain

/**
 * 投票照会（年度）_DB読み込み（初期表示時）
 */
router.post('/find', (req, res) => {
  finddata(req, res)
})

/**
 * 初期表示データ取得用関数
 * @req {*} req
 * @res {*} res
 */
async function finddata(req, res) {
  var resdatas = []
  var resbccoin = []
  var sakicoin = 0
  var sakicoin_sum = 0
  var getcoin = []
  var dcnt = 0

  resdatas = await PresenCntGet(req)
  resbccoin = await ZoyoCoinGet(req)

  console.log('★★★取得後')
  console.log(resdatas)
  console.log(resbccoin)

  dcnt = resdatas.length

  for (let i in resdatas) {
    for (let n in resbccoin) {
      if (resdatas[i].t_shain_pk === resbccoin[n].zsakishain) {
        param = {
          account: resbccoin[n].transaction_id
        }
        sakicoin = await bccoinget(param)
        sakicoin_sum += sakicoin
      }
    }
    getcoin[i] = sakicoin_sum
  }

  res.json({ status: true, data: resdatas, getcoin: getcoin, dcnt: dcnt })
}

/**
 * 発表件数取得用関数
 * @req {*} req
 */
function PresenCntGet(req) {
  return new Promise((resolve, reject) => {
    var sql =
      'select d.t_shain_pk,d.shimei,d.shimei_kana,coalesce(c.presen_cnt,0) as presen_cnt from t_shain d ' +
      'left join (select a.t_shain_pk,count(a.t_shain_pk) as presen_cnt from t_presenter a ' +
      'inner join t_senkyo b on a.t_senkyo_pk = b.t_senkyo_pk where b.tohyo_kaishi_dt >= :mypk1 and b.tohyo_kaishi_dt <= :mypk2 and ' +
      "a.delete_flg = '0' and b.delete_flg = '0' group by a.t_shain_pk) c on d.t_shain_pk = c.t_shain_pk " +
      "where d.delete_flg = '0' and d.kengen_cd <> '0' order by d.shimei_kana"
    db
      .query(sql, {
        replacements: {
          mypk1: req.body.pNendoStr,
          mypk2: req.body.pNendoEnd
        },
        type: db.QueryTypes.RAW
      })
      .spread((datas, metadata) => {
        return resolve(datas)
      })
  })
}

/**
 * 贈与コイン数取得
 * @req {*} req
 */
function ZoyoCoinGet(req) {
  return new Promise((resolve, reject) => {
    var sql =
      'select zoyo_moto_shain_pk zmotoshain,zoyo_saki_shain_pk zsakishain,transaction_id from t_zoyo ' +
      "where insert_tm >= :mypk1 and insert_tm <= :mypk2 and delete_flg = '0' and nenji_flg = '0'"
    db
      .query(sql, {
        replacements: {
          mypk1: req.body.pNendoStr,
          mypk2: req.body.pNendoEnd
        },
        type: db.QueryTypes.RAW
      })
      .spread((datas, metadata) => {
        return resolve(datas)
      })
  })
}

/**
 * BCコイン取得用関数（明細単位でのコイン取得）
 * @param {*} param
 */
function bccoinget(param) {
  return new Promise((resolve, reject) => {
    request
      .post(bcdomain + '/bc-api/get_transaction')
      .send(param)
      .end((err, res) => {
        if (err) {
          console.log('★' + err)
          return
        }
        return resolve(res.body.coin)
      })
  })
}

module.exports = router
