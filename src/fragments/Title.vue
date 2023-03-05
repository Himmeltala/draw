<script setup lang="ts">
import { SuccessFilled } from "@element-plus/icons-vue";

const title = useStorage<any>("title", "点击修改本次活动标题");

if (!title.value) {
  title.value = "点击修改本次活动标题";
}

const isEdit = ref(false);
</script>

<template>
  <div class="title flex-center flex-items-center">
    <template v-if="!isEdit">
      <h1 class="flex-center flex-items-center" @click="isEdit = !isEdit">{{ title }}</h1>
    </template>
    <template v-else>
      <h1 class="flex-center flex-items-center">
        <el-input size="large" v-model="title" />
        <el-button class="mg-l-10" type="success" plain circle :icon="SuccessFilled" @click="isEdit = !isEdit" />
      </h1>
    </template>
  </div>
</template>

<style scoped lang="css">
h1 {
  margin: 0;
  text-align: center;
}

.title {
  height: 10%;
}
</style>
