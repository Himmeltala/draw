<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { useStorage } from "@vueuse/core";
import { ElMessage } from "element-plus";
import type { UploadInstance, UploadProps, UploadRawFile, FormRules, FormInstance } from "element-plus";
import { Search, Upload, Delete, Minus, Download, Close, SuccessFilled } from "@element-plus/icons-vue";
import { importXlsx, exportXlsx, FileType } from "./utils/xlsx";
import { Extract } from "./utils/extract";
import { CanvasApp } from "./utils/draw_canvas";

let xlsx = useStorage<any>("xlsx-data", []);
let copyXlsx = ref(JSON.parse(JSON.stringify(xlsx.value)));
let tips = ref("");

function inspectData(xlsx: any) {
  if (xlsx.length > 0) tips.value = `<span>你已经导入表格，点击查看数据</span>`;
  else tips.value = `<span class="text-red">你没有导入表格，点击上传文件</span>`;
}

const stage = ref<any>(null);
const canvas = ref<any>(null);
let canvasApp = new CanvasApp("#canvas-2d", 500, 0.3, 1, false, xlsx.value);
let speed = ref(1);

onMounted(() => {
  inspectData(xlsx.value);
  watch(
    () => xlsx.value,
    (newValue, oldValue) => inspectData(newValue),
    { deep: true }
  );

  canvas.value.height = stage.value.clientHeight;
  canvas.value.width = stage.value.clientWidth;

  canvasApp.create();
  canvasApp.init();
});

const upload = ref<UploadInstance>();

const handleExceed: UploadProps["onExceed"] = files => {
  upload.value!.clearFiles();
  upload.value!.handleStart(files[0] as UploadRawFile);
};

const onChange: UploadProps["onChange"] = file => {
  let fileType = file.raw?.type;
  if (fileType == FileType.XLS || fileType == FileType.XLSX) importXlsx(file, xlsx);
  else ElMessage.error("文件类型只能是 XLSX 或 XLS!");
};

let configDialog = ref(false);
let exportXlsxDialog = ref(false);

let configFormData = reactive<any>({
  remark: "",
  max: 1,
  rate: 120,
  size: 14
});

let exportFormData = ref({
  filename: "",
  sheetName: ""
});

let disabledStart = ref(false);
let disabledClose = ref(true);

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
let stochastic = ref<any[]>([]);

const start = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      canvasApp.setSpeed = speed.value;
      clearInterval(canvasApp.getTimer);
      canvasApp.setTimer = setInterval(() => {
        canvasApp.onTimer();
      }, 10 / 24);
      stochastic.value = [];
      for (let i = 0; i < configFormData.max; i++) stochastic.value.push(xlsx.value[Math.floor(Math.random() * xlsx.value.length)]);
      disabledStart.value = true;
      disabledClose.value = false;
    } else ElMessage.error("请确认表单信息填写完整！");
  });
};

function close() {
  if (interval != 0) clearInterval(interval);
  copyXlsx.value = JSON.parse(JSON.stringify(xlsx.value));
  let random = new Extract(copyXlsx.value, configFormData).random();
  stochastic.value = [];
  for (let i = 0; i < random.length; i++) {
    for (let j = 0; j < xlsx.value.length; j++) {
      if (copyXlsx.value[random[i]].学号 === xlsx.value[j].学号) {
        let obj = xlsx.value[j];
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
  disabledStart.value = false;
  disabledClose.value = true;
}

let editIndex = ref(-1);
let isEdit = ref(false);

function handleEdit(index: any, row: any) {
  editIndex.value = index;
  isEdit.value = !isEdit.value;
}

function handleEditComplete() {
  editIndex.value = -1;
  isEdit.value = !isEdit.value;
}

function handleDelete(index: any, row: any) {
  xlsx.value.splice(index, 1);
}

function reloadRemark() {
  for (let i = 0; i < xlsx.value.length; i++) {
    xlsx.value[i]["备注"] = "";
  }
}

function reloadTag() {
  for (let i = 0; i < xlsx.value.length; i++) {
    xlsx.value[i]["标签"] = "";
  }
}

const exportData = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      exportXlsx(xlsx.value, exportFormData.value.filename + ".xlsx", exportFormData.value.sheetName);
      exportXlsxDialog.value = !exportXlsxDialog.value;
    } else ElMessage.error("请确认表单信息填写完整！");
  });
};

let isEditedTitle = ref(false);
let title = useStorage<any>("title", "点击修改本次活动标题");

let drawDialog = ref(false);
</script>

<template>
  <div class="container flex-space">
    <div class="content">
      <template v-if="!isEditedTitle">
        <h1 @click="isEditedTitle = !isEditedTitle">{{ title }}</h1>
      </template>
      <template v-else>
        <h1 class="title flex-center flex-items-center">
          <el-input size="large" v-model="title" />
          <el-button class="mg-l-10" type="success" plain circle :icon="SuccessFilled" @click="isEditedTitle = !isEditedTitle" />
        </h1>
      </template>
      <div ref="stage" id="stage" class="stage flex-center flex-items-center flex-wrap">
        <!-- <div
          v-for="(item, index) in stochastic"
          :key="index"
          class="student flex-center flex-items-center flex-nowrap flex-col"
          :style="{ 'font-size': configFormData.size + 'px', width: configFormData.size * 9 + 'px', height: configFormData.size * 9 + 'px' }">
          <Avatar />
          <div class="compellation">{{ item["姓名"] }}</div>
          <div class="dientifier">{{ item["学号"] }}</div>
        </div> -->
        <canvas id="canvas-2d" ref="canvas" />
        <el-dialog v-model="drawDialog" title="谁是幸运儿？" width="30%" align-center>
          <div class="student flex-center flex-items-center flex-wrap flex-row">
            <div v-for="(item, index) in stochastic" :key="index" :style="{ 'font-size': configFormData.size + 'px', width: configFormData.size * 9 + 'px', height: configFormData.size * 9 + 'px' }">
              <Avatar />
              <div class="compellation">{{ item["姓名"] }}</div>
              <div class="dientifier">{{ item["学号"] }}</div>
            </div>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="drawDialog = false">取消</el-button>
              <el-button type="primary" @click="drawDialog = false">再来</el-button>
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
            <el-link href="https://gitee.com/Enziandom/gadget-webrandom#%E9%A1%B9%E7%9B%AE%E8%AF%B4%E6%98%8E" class="mg-l-10" target="_blank">遇到问题</el-link>
          </el-tooltip>
        </h3>
        <el-upload ref="upload" :limit="1" :on-change="onChange" :on-exceed="handleExceed" :auto-upload="false">
          <template #trigger>
            <el-button class="mg-r-10" plain type="primary" :icon="Upload">上传文件</el-button>
          </template>
          <template #tip>
            <div class="el-upload__tip" v-html="tips"></div>
          </template>
        </el-upload>
        <div class="managers flex-space flex-items-center flex-wrap">
          <el-button plain :icon="Search" @click="configDialog = true">查看数据</el-button>
          <el-button plain :icon="Minus" @click="reloadRemark">清除备注</el-button>
          <el-button plain :icon="Close" @click="reloadTag">清除标签</el-button>
          <el-button plain :icon="Delete" @click="xlsx = []" type="danger">清除数据</el-button>
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
            <el-input-number controls-position="right" v-model="configFormData.max" :min="1" :max="copyXlsx.length" />
          </el-form-item>
          <el-form-item label="随机速率">
            <el-slider :min="0.1" :max="20" :step="0.1" size="small" input-size="small" v-model="speed" />
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
      <el-table :data="xlsx" stripe style="width: 100%">
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

<style scoped>
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
  height: 15%;
  text-align: center;
  box-sizing: border-box;
}

.stage {
  height: 85%;
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
