<script setup lang="ts">
import { PropType } from "vue";
import { FormRules } from "element-plus";

defineProps({
  form: {
    type: Object as PropType<any>,
    required: true
  }
});

const formRules = reactive<FormRules>({
  remark: [
    { required: true, message: "请输入本次随机备注", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 ~ 100", trigger: "blur" }
  ]
});
const xlsxData = useStorage<any>("xlsx-data", []);
const config = ref();

defineExpose({
  config
});
</script>

<template>
  <div class="configs">
    <h3>配置</h3>
    <el-form ref="config" :rules="formRules" label-position="left" :model="form" label-width="100px">
      <el-form-item label="本次备注" prop="remark">
        <el-input v-model="form.remark" placeholder="一等奖、二等奖、上台表演等" />
      </el-form-item>
      <el-form-item label="抽取人数">
        <el-input-number controls-position="right" v-model="form.max" :min="1" :max="xlsxData.length || 2" />
      </el-form-item>
      <el-form-item label="随机速率">
        <el-slider :min="0.5" :max="20" :step="0.5" size="small" input-size="small" v-model="form.speed" />
      </el-form-item>
      <el-form-item label="文字大小">
        <el-slider :min="14" :max="30" :step="1" size="small" input-size="small" v-model="form.size" />
      </el-form-item>
    </el-form>
  </div>
</template>
