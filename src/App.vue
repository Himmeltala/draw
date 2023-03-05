<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { useStorage } from "@vueuse/core";
import { Extract } from "./utils/extract";
import { CanvasApp } from "./utils/draw_canvas";
import beginBg from "./assets/begin-bg.mp3";
import endBg from "./assets/end-bg.mp3";

const xlsxData = useStorage<any>("xlsx-data", []);
const copyXlsx = ref(JSON.parse(JSON.stringify(xlsxData.value)));
const dataSourceTip = ref("");
const stage = ref();
const canvasInstance = ref();
const canvas = new CanvasApp("#canvas", 500, 0.3, 1, false);
const disabledStart = ref(false);
const disabledClose = ref(true);
const stochastic = ref<any[]>([]);
const configFormData = reactive<any>({
  remark: "",
  max: 1,
  rate: 120,
  size: 14,
  speed: 0
});
const drawDialog = ref(false);
const audioSrc = ref(endBg);
const audio = ref();
const configFormInstance = ref<any>();
let interval = 0;

function inspectImportStatus(xlsx: any) {
  if (xlsx.length > 0) {
    dataSourceTip.value = `<span>你已经导入表格，点击查看数据</span>`;
    disabledStart.value = false;
    disabledClose.value = true;
    canvas.setData = xlsxData.value;
    canvasInstance.value.height = stage.value.clientHeight;
    canvasInstance.value.width = stage.value.clientWidth;
    canvas.create();
    canvas.init();
    return true;
  } else {
    dataSourceTip.value = `<span class="text-red">你没有导入表格，点击上传文件</span>`;
    disabledStart.value = true;
    disabledClose.value = true;
    return false;
  }
}

onMounted(() => {
  inspectImportStatus(xlsxData.value);

  watch(
    xlsxData,
    val => {
      inspectImportStatus(val);
    },
    { deep: true }
  );
});

const start = async () => {
  if (!configFormInstance.value?.config) return;
  await configFormInstance.value?.config.validate((valid: any) => {
    if (valid) {
      audio.value.src = beginBg;
      audio.value.loop = true;
      audio.value.play();
      canvas.setSpeed = configFormData.speed;
      clearInterval(canvas.getTimer);
      canvas.setTimer = setInterval(() => {
        canvas.onTimer();
      }, 10 / 24);
      stochastic.value = [];
      for (let i = 0; i < configFormData.max; i++) stochastic.value.push(xlsxData.value[Math.floor(Math.random() * xlsxData.value.length)]);
      disabledStart.value = true;
      disabledClose.value = false;
    } else ElMessage.error("请确认表单信息填写完整！");
  });
};

function close() {
  if (interval != 0) clearInterval(interval);
  copyXlsx.value = JSON.parse(JSON.stringify(xlsxData.value));
  let random = new Extract(copyXlsx.value, configFormData).random();
  stochastic.value = [];
  for (let i = 0; i < random.length; i++) {
    for (let j = 0; j < xlsxData.value.length; j++) {
      if (copyXlsx.value[random[i]].学号 === xlsxData.value[j].学号) {
        let obj = xlsxData.value[j];
        if (!obj["备注"]) obj["备注"] = "";
        if (!obj["标签"]) obj["标签"] = "";
        obj["标签"] = true;
        obj["备注"] += configFormData.remark + "；";
        stochastic.value.push(obj);
      }
    }
  }
  canvas.setSpeed = 0.3;
  clearInterval(canvas.getTimer);
  canvas.setTimer = setInterval(() => {
    canvas.onTimer();
  }, 10 / 24);
  drawDialog.value = !drawDialog.value;
  audio.value.pause();
  audio.value.src = endBg;
  audio.value.loop = false;
  audio.value.play();
  disabledStart.value = false;
  disabledClose.value = true;
}

function over() {
  drawDialog.value = !drawDialog.value;
  audio.value.pause();
}
</script>

<template>
  <div class="container flex-space">
    <audio ref="audio" loop="true" :src="audioSrc" />
    <div class="content">
      <Title></Title>
      <div ref="stage" class="stage flex-center flex-items-center flex-wrap">
        <canvas id="canvas" ref="canvasInstance" />
        <el-dialog v-model="drawDialog" :title="'本次 ' + configFormData.remark + ' 结果'" width="30%" align-center>
          <div class="flex-center flex-items-center flex-wrap flex-row">
            <div class="items" v-for="(item, index) in stochastic" :key="index" :style="{ 'font-size': configFormData.size + 'px' }">
              <div class="flex-center flex-items-center">
                <Avatar />
              </div>
              <div class="flex-center flex-items-center">{{ item["姓名"] }}</div>
              <div class="flex-center flex-items-center">{{ item["学号"] }}</div>
            </div>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button class="mg-r-10" @click="over">取消</el-button>
              <el-button type="primary" @click="over">再来</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
    <div class="sidebar">
      <DataSource :tip="dataSourceTip" />
      <Config ref="configFormInstance" :form="configFormData" />
      <div>
        <h3>操作</h3>
        <el-button class="mg-r-10" type="primary" plain @click="start" :disabled="disabledStart">开始随机</el-button>
        <el-button type="danger" plain @click="close" :disabled="disabledClose">关闭随机</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.container {
  height: 100vh;
}

.sidebar {
  width: 25%;
}

.content {
  width: 75%;
}

.content .items {
  padding: 10px;
}

.stage {
  height: 90%;
}
</style>
