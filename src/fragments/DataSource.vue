<script setup lang="ts">
import { importXlsx, exportXlsx, FileType } from "../utils/xlsx";
import { Search, Upload, Delete, Minus, Download, Close } from "@element-plus/icons-vue";
import type { UploadInstance, UploadProps, UploadRawFile, FormInstance, FormRules } from "element-plus";

defineProps({
  tip: {
    type: String,
    required: true
  }
});

const importDialog = ref(false);
const exportDialog = ref(false);
const xlsxData = useStorage<any>("xlsx-data", []);
const uploadInstance = ref<UploadInstance>();
const editIndex = ref(-1);
const isEditing = ref(false);
const exporFormData = ref({
  filename: "",
  sheetName: ""
});
const exportFormInstance = ref<FormInstance>();
const exportFormRules = reactive<FormRules>({
  filename: [
    { required: true, message: "请输入导出的文件名", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 ~ 100", trigger: "blur" }
  ],
  sheetName: [
    { required: true, message: "请输入导出的表格的表名称", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 ~ 100", trigger: "blur" }
  ]
});

function handleEdit(index: any) {
  editIndex.value = index;
  isEditing.value = !isEditing.value;
}

function handleEditComplete() {
  editIndex.value = -1;
  isEditing.value = !isEditing.value;
}

function handleDelete(index: any) {
  xlsxData.value.splice(index, 1);
}

const onUploadChange: UploadProps["onChange"] = async file => {
  const fileType = file.raw?.type;
  if (fileType == FileType.XLS || fileType == FileType.XLSX) {
    await importXlsx(file, xlsxData);
    ElMessage.success({ message: "导入数据成功，请刷新页面再继续！", type: "success", duration: 5000 });
  } else ElMessage.error("文件类型只能是 XLSX 或 XLS!");
};

const onUploadExceed: UploadProps["onExceed"] = files => {
  uploadInstance.value!.clearFiles();
  uploadInstance.value!.handleStart(files[0] as UploadRawFile);
};

function resetMarks() {
  for (let i = 0; i < xlsxData.value.length; i++) {
    xlsxData.value[i]["备注"] = "";
  }
}

function resetTags() {
  for (let i = 0; i < xlsxData.value.length; i++) {
    xlsxData.value[i]["标签"] = "";
  }
}

const exportData = async (el: FormInstance | undefined) => {
  if (!el) return;
  await el.validate(valid => {
    if (valid) {
      exportXlsx(xlsxData.value, exporFormData.value.filename + ".xlsx", exporFormData.value.sheetName);
      exportDialog.value = !exportDialog.value;
    } else ElMessage.error("请确认表单信息填写完整！");
  });
};
</script>

<template>
  <div class="datasource">
    <h3>
      <span>数据管理</span>
      <el-tooltip effect="dark" content="遇到问题？点击查看文档" placement="top-start">
        <el-link href="https://github.com/Himmeltala/draw" class="mg-l-10" target="_blank">遇到问题?</el-link>
      </el-tooltip>
    </h3>
    <el-upload ref="uploadInstance" :limit="1" :on-change="onUploadChange" :on-exceed="onUploadExceed" :auto-upload="false">
      <template #trigger>
        <el-button class="mg-r-10" plain type="primary" :icon="Upload">上传文件</el-button>
      </template>
      <template #tip>
        <div class="el-upload__tip" v-html="tip"></div>
      </template>
    </el-upload>
    <div class="flex-space flex-items-center flex-wrap">
      <el-button plain :icon="Search" @click="importDialog = true">查看数据</el-button>
      <el-button plain :icon="Minus" @click="resetMarks">清除备注</el-button>
      <el-button plain :icon="Close" @click="resetTags">清除标签</el-button>
      <el-button plain :icon="Delete" @click="xlsxData = []" type="danger">清除数据</el-button>
      <el-button plain :icon="Download" @click="exportDialog = !exportDialog" type="success">导出数据</el-button>
    </div>
  </div>
  <el-dialog v-model="importDialog" title="导入的数据" width="50%">
    <el-table :data="xlsxData" stripe style="width: 100%">
      <el-table-column prop="学号" label="学号">
        <template #default="scope">
          <template v-if="scope.$index === editIndex && isEditing">
            <el-input size="small" v-model="scope.row.学号" />
          </template>
          <template v-else>
            {{ scope.row.学号 }}
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="姓名" label="姓名">
        <template #default="scope">
          <template v-if="scope.$index === editIndex && isEditing">
            <el-input size="small" v-model="scope.row.姓名" />
          </template>
          <template v-else>
            {{ scope.row.姓名 }}
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="备注" label="备注">
        <template #default="scope">
          <template v-if="scope.$index === editIndex && isEditing">
            <el-input size="small" v-model="scope.row.备注" />
          </template>
          <template v-else>
            {{ scope.row.备注 }}
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="标签" label="标签">
        <template #default="scope">
          <template v-if="scope.$index === editIndex && isEditing">
            <el-input size="small" v-model="scope.row.标签" />
          </template>
          <template v-else>
            {{ scope.row.标签 }}
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <template v-if="scope.$index === editIndex && isEditing">
            <el-button size="small" @click="handleEditComplete">完成</el-button>
          </template>
          <template v-else>
            <el-button size="small" @click="handleEdit(scope.$index)">编辑</el-button>
          </template>
          <el-button size="small" type="danger" @click="handleDelete(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="importDialog = false">关闭</el-button>
        <el-button type="primary" @click="importDialog = false">确定</el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog v-model="exportDialog" title="导出数据" width="30%">
    <el-form ref="exportFormInstance" :rules="exportFormRules" label-position="left" :model="exporFormData" label-width="100px">
      <el-form-item label="文件名" prop="filename">
        <el-input v-model="exporFormData.filename" />
      </el-form-item>
      <el-form-item label="表名称" prop="sheetName">
        <el-input v-model="exporFormData.sheetName" />
      </el-form-item>
    </el-form>
    <div class="text-align-right">
      <el-button @click="exportData(exportFormInstance)" :icon="Download">确定导出</el-button>
    </div>
  </el-dialog>
</template>
