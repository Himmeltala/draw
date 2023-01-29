<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { useStorage } from "@vueuse/core";
import { ElMessage } from "element-plus";
import type { UploadInstance, UploadProps, UploadRawFile, FormRules, FormInstance } from "element-plus";
import { Search, Upload, Delete, Minus, Download, Close, SuccessFilled } from "@element-plus/icons-vue";
import { importXlsx, exportXlsx, FileType } from "./utils/xlsx";
import { Extract } from "./utils/extract";
import { CanvasApp } from "./utils/draw_canvas";
import beginBg from "./assets/begin-bg.mp3";
import endBg from "./assets/end-bg.mp3";

const xlsxLocalStoreage = useStorage<any>("xlsx-data", []);
const copyXlsx = ref(JSON.parse(JSON.stringify(xlsxLocalStoreage.value)));
const xlsxImportedTip = ref("");

const stage = ref<any>(null);
const canvas = ref<any>(null);
const canvasApp = new CanvasApp("#canvas-2d", 500, 0.3, 1, false);
const speed = ref(10);

function checkXlsxIsImported(xlsx: any) {
  if (xlsx.length > 0) {
    xlsxImportedTip.value = `<span>你已经导入表格，点击查看数据</span>`;
    disabledStart.value = false;
    disabledClose.value = true;
    canvasApp.setData = xlsxLocalStoreage.value;
    canvas.value.height = stage.value.clientHeight;
    canvas.value.width = stage.value.clientWidth;
    canvasApp.create();
    canvasApp.init();
    return true;
  } else {
    xlsxImportedTip.value = `<span class="text-red">你没有导入表格，点击上传文件</span>`;
    disabledStart.value = true;
    disabledClose.value = true;
    return false;
  }
}

onMounted(() => {
  checkXlsxIsImported(xlsxLocalStoreage.value);
  watch(
    () => xlsxLocalStoreage.value,
    updatedXlsx => {
      checkXlsxIsImported(updatedXlsx);
    },
    { deep: true }
  );
});

const upload = ref<UploadInstance>();

const handleExceed: UploadProps["onExceed"] = files => {
  upload.value!.clearFiles();
  upload.value!.handleStart(files[0] as UploadRawFile);
};

const onChange: UploadProps["onChange"] = async file => {
  const fileType = file.raw?.type;
  if (fileType == FileType.XLS || fileType == FileType.XLSX) {
    await importXlsx(file, xlsxLocalStoreage);
    ElMessage.success({
      message: "导入数据成功，请刷新页面再继续！",
      type: "success",
      duration: 5000
    });
  } else ElMessage.error("文件类型只能是 XLSX 或 XLS!");
};

const configDialog = ref(false);
const exportXlsxDialog = ref(false);

const configFormData = reactive<any>({
  remark: "",
  max: 1,
  rate: 120,
  size: 14
});

const exportFormData = ref({
  filename: "",
  sheetName: ""
});

const disabledStart = ref(false);
const disabledClose = ref(true);

const configFormRef = ref<FormInstance>();
const configRules = reactive<FormRules>({
  remark: [
    { required: true, message: "请输入本次随机备注", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 ~ 100", trigger: "blur" }
  ]
});

const exportFormRef = ref<FormInstance>();
const exportRules = reactive<FormRules>({
  filename: [
    { required: true, message: "请输入导出的文件名", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 ~ 100", trigger: "blur" }
  ],
  sheetName: [
    { required: true, message: "请输入导出的表格的表名称", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 ~ 100", trigger: "blur" }
  ]
});

let interval = 0;
const stochastic = ref<any[]>([]);

const start = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      audio.value.src = beginBg;
      audio.value.loop = true;
      audio.value.play();
      canvasApp.setSpeed = speed.value;
      clearInterval(canvasApp.getTimer);
      canvasApp.setTimer = setInterval(() => {
        canvasApp.onTimer();
      }, 10 / 24);
      stochastic.value = [];
      for (let i = 0; i < configFormData.max; i++) stochastic.value.push(xlsxLocalStoreage.value[Math.floor(Math.random() * xlsxLocalStoreage.value.length)]);
      disabledStart.value = true;
      disabledClose.value = false;
    } else ElMessage.error("请确认表单信息填写完整！");
  });
};

function close() {
  if (interval != 0) clearInterval(interval);
  copyXlsx.value = JSON.parse(JSON.stringify(xlsxLocalStoreage.value));
  let random = new Extract(copyXlsx.value, configFormData).random();
  stochastic.value = [];
  for (let i = 0; i < random.length; i++) {
    for (let j = 0; j < xlsxLocalStoreage.value.length; j++) {
      if (copyXlsx.value[random[i]].学号 === xlsxLocalStoreage.value[j].学号) {
        let obj = xlsxLocalStoreage.value[j];
        if (!obj["备注"]) obj["备注"] = "";
        if (!obj["标签"]) obj["标签"] = "";
        obj["标签"] = true;
        obj["备注"] += configFormData.remark + "；";
        stochastic.value.push(obj);
      }
    }
  }
  canvasApp.setSpeed = 0.3;
  clearInterval(canvasApp.getTimer);
  canvasApp.setTimer = setInterval(() => {
    canvasApp.onTimer();
  }, 10 / 24);
  drawDialog.value = !drawDialog.value;
  audio.value.pause();
  audio.value.src = endBg;
  audio.value.loop = false;
  audio.value.play();
  disabledStart.value = false;
  disabledClose.value = true;
}

const editIndex = ref(-1);
const isEdit = ref(false);

function handleEdit(index: any, row: any) {
  editIndex.value = index;
  isEdit.value = !isEdit.value;
}

function handleEditComplete() {
  editIndex.value = -1;
  isEdit.value = !isEdit.value;
}

function handleDelete(index: any, row: any) {
  xlsxLocalStoreage.value.splice(index, 1);
}

function reloadRemark() {
  for (let i = 0; i < xlsxLocalStoreage.value.length; i++) {
    xlsxLocalStoreage.value[i]["备注"] = "";
  }
}

function reloadTag() {
  for (let i = 0; i < xlsxLocalStoreage.value.length; i++) {
    xlsxLocalStoreage.value[i]["标签"] = "";
  }
}

const exportData = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      exportXlsx(xlsxLocalStoreage.value, exportFormData.value.filename + ".xlsx", exportFormData.value.sheetName);
      exportXlsxDialog.value = !exportXlsxDialog.value;
    } else ElMessage.error("请确认表单信息填写完整！");
  });
};

const isEditedTitle = ref(false);
const title = useStorage<any>("title", "点击修改本次活动标题");

const drawDialog = ref(false);
const audioSrc = ref(endBg);
const audio = ref<any>(null);

function over() {
  drawDialog.value = !drawDialog.value;
  audio.value.pause();
}
</script>

<template>
  <div class="container flex-space">
    <audio ref="audio" loop="true" :src="audioSrc" />
    <div class="content">
      <template v-if="!isEditedTitle">
        <h1 class="title flex-center flex-items-center" @click="isEditedTitle = !isEditedTitle">{{ title }}</h1>
      </template>
      <template v-else>
        <h1 class="title flex-center flex-items-center">
          <el-input size="large" v-model="title" />
          <el-button class="mg-l-10" type="success" plain circle :icon="SuccessFilled" @click="isEditedTitle = !isEditedTitle" />
        </h1>
      </template>
      <div ref="stage" id="stage" class="stage flex-center flex-items-center flex-wrap">
        <canvas id="canvas-2d" ref="canvas" />
        <el-dialog v-model="drawDialog" :title="'本次 ' + configFormData.remark + ' 结果'" width="30%" align-center>
          <div class="student flex-center flex-items-center flex-wrap flex-row">
            <div v-for="(item, index) in stochastic" :key="index" :style="{ 'font-size': configFormData.size + 'px', width: configFormData.size * 9 + 'px', height: configFormData.size * 9 + 'px' }">
              <Avatar />
              <div class="compellation">{{ item["姓名"] }}</div>
              <div class="dientifier">{{ item["学号"] }}</div>
            </div>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="over">取消</el-button>
              <el-button type="primary" @click="over">再来</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
    <div class="sidebar">
      <div class="datasource">
        <h3>
          <span>数据管理</span>
          <el-tooltip class="tooltip" effect="dark" content="遇到问题？点击查看文档" placement="top-start">
            <el-link href="https://gitee.com/Himmelbleu/luck-draw#%E9%A1%B9%E7%9B%AE%E8%AF%B4%E6%98%8E" class="mg-l-10" target="_blank">遇到问题?</el-link>
          </el-tooltip>
        </h3>
        <el-upload ref="upload" :limit="1" :on-change="onChange" :on-exceed="handleExceed" :auto-upload="false">
          <template #trigger>
            <el-button class="mg-r-10" plain type="primary" :icon="Upload">上传文件</el-button>
          </template>
          <template #tip>
            <div class="el-upload__tip" v-html="xlsxImportedTip"></div>
          </template>
        </el-upload>
        <div class="managers flex-space flex-items-center flex-wrap">
          <el-button plain :icon="Search" @click="configDialog = true">查看数据</el-button>
          <el-button plain :icon="Minus" @click="reloadRemark">清除备注</el-button>
          <el-button plain :icon="Close" @click="reloadTag">清除标签</el-button>
          <el-button plain :icon="Delete" @click="xlsxLocalStoreage = []" type="danger">清除数据</el-button>
          <el-button plain :icon="Download" @click="exportXlsxDialog = !exportXlsxDialog" type="success">导出数据</el-button>
        </div>
      </div>
      <div class="configs">
        <h3>配置</h3>
        <el-form ref="configFormRef" :rules="configRules" label-position="left" :model="configFormData" label-width="100px">
          <el-form-item label="本次备注" prop="remark">
            <el-input v-model="configFormData.remark" placeholder="一等奖、二等奖、上台表演等" />
          </el-form-item>
          <el-form-item label="抽取人数">
            <el-input-number controls-position="right" v-model="configFormData.max" :min="1" :max="xlsxLocalStoreage.length || 2" />
          </el-form-item>
          <el-form-item label="随机速率">
            <el-slider :min="0.5" :max="20" :step="0.5" size="small" input-size="small" v-model="speed" />
          </el-form-item>
          <el-form-item label="文字大小">
            <el-slider :min="14" :max="30" :step="1" size="small" input-size="small" v-model="configFormData.size" />
          </el-form-item>
        </el-form>
      </div>
      <div class="operation">
        <h3>操作</h3>
        <el-button type="primary" plain @click="start(configFormRef)" :disabled="disabledStart">开始随机</el-button>
        <el-button type="danger" plain @click="close" :disabled="disabledClose">关闭随机</el-button>
      </div>
    </div>
    <el-dialog v-model="configDialog" title="导入的数据" width="50%">
      <el-table :data="xlsxLocalStoreage" stripe style="width: 100%">
        <el-table-column prop="学号" label="学号">
          <template #default="scope">
            <template v-if="scope.$index === editIndex && isEdit">
              <el-input size="small" v-model="scope.row.学号" />
            </template>
            <template v-else>
              {{ scope.row.学号 }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="姓名" label="姓名">
          <template #default="scope">
            <template v-if="scope.$index === editIndex && isEdit">
              <el-input size="small" v-model="scope.row.姓名" />
            </template>
            <template v-else>
              {{ scope.row.姓名 }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="备注" label="备注">
          <template #default="scope">
            <template v-if="scope.$index === editIndex && isEdit">
              <el-input size="small" v-model="scope.row.备注" />
            </template>
            <template v-else>
              {{ scope.row.备注 }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="标签" label="标签">
          <template #default="scope">
            <template v-if="scope.$index === editIndex && isEdit">
              <el-input size="small" v-model="scope.row.标签" />
            </template>
            <template v-else>
              {{ scope.row.标签 }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <template v-if="scope.$index === editIndex && isEdit">
              <el-button size="small" @click="handleEditComplete">完成</el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
            </template>
            <el-button size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="configDialog = false">关闭</el-button>
          <el-button type="primary" @click="configDialog = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog v-model="exportXlsxDialog" title="导出数据" width="30%">
      <el-form ref="exportFormRef" :rules="exportRules" label-position="left" :model="exportFormData" label-width="100px">
        <el-form-item label="文件名" prop="filename">
          <el-input v-model="exportFormData.filename" />
        </el-form-item>
        <el-form-item label="表名称" prop="sheetName">
          <el-input v-model="exportFormData.sheetName" />
        </el-form-item>
      </el-form>
      <div class="text-align-right">
        <el-button @click="exportData(exportFormRef)" :icon="Download">确定导出</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="css">
.container {
  height: 100vh;
}

.tooltip {
  cursor: pointer;
}

.sidebar {
  width: 28%;
  padding: 0 20px;
  box-sizing: border-box;
}

.content {
  width: 70%;
  padding: 10px;
  box-sizing: border-box;
}

.content > h1 {
  margin: 0;
  height: 10%;
  text-align: center;
  box-sizing: border-box;
}

.stage {
  height: 90%;
}

.managers {
  margin-top: 10px;
}

.managers > button {
  margin: 0;
  margin-top: 10px;
}

.student {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.student > div {
  width: 110px !important;
  height: 110px !important;
  text-align: center;
}
</style>
